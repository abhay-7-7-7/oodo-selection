from decimal import Decimal, ROUND_HALF_UP
from datetime import date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.product import Product, Variant
from app.models.tax import Tax
from app.models.discount import Discount


def quantize_paise(val: Decimal) -> int:
    """Rounds Decimal to nearest integer paise with half rounded away from zero."""
    return int(val.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


class PricingLineItem:
    def __init__(
        self,
        product: Product,
        variant: Optional[Variant],
        quantity: int,
        tax: Optional[Tax] = None,
        unit_price_override: Optional[int] = None
    ):
        self.product = product
        self.variant = variant
        self.quantity = quantity
        self.tax = tax
        self.unit_price_override = unit_price_override


class PricingService:
    @staticmethod
    def calculate_pricing(
        db: Session,
        items: List[PricingLineItem],
        as_of_date: date,
        applied_discount: Optional[Discount] = None
    ) -> Dict[str, Any]:
        """
        Calculates line pricing, eligible discounts, and taxes with exact paise arithmetic.
        Returns line-by-line breakdown and overall totals.
        """
        line_breakdowns = []
        overall_base_amount = 0
        overall_variant_extra = 0
        overall_subtotal = 0
        total_quantity = sum(item.quantity for item in items)

        # 1. First pass: calculate base, variant extra, and subtotal per line
        # Check for global default tax (applies_to == 'all')
        default_tax = db.query(Tax).filter(Tax.is_active.is_(True), Tax.applies_to == "all").first()

        for item in items:
            base_price = item.product.sales_price
            variant_extra = item.variant.price_extra if item.variant else 0
            unit_price = item.unit_price_override if item.unit_price_override is not None else (base_price + variant_extra)
            line_base_total = base_price * item.quantity
            line_variant_total = variant_extra * item.quantity
            line_subtotal = unit_price * item.quantity

            overall_base_amount += line_base_total
            overall_variant_extra += line_variant_total
            overall_subtotal += line_subtotal

            effective_tax = item.tax if item.tax else default_tax
            tax_rate = effective_tax.rate_percent if effective_tax else Decimal("0.00")

            line_breakdowns.append({
                "item": item,
                "effective_tax": effective_tax,
                "base_price": base_price,
                "variant_extra": variant_extra,
                "unit_price": unit_price,
                "quantity": item.quantity,
                "line_base_total": line_base_total,
                "line_variant_total": line_variant_total,
                "line_subtotal": line_subtotal,
                "discount": 0,
                "taxable_amount": line_subtotal,
                "tax": 0,
                "total": line_subtotal,
                "tax_rate": tax_rate
            })

        # 2. Evaluate discount if supplied, or discover eligible discounts
        chosen_discount = applied_discount
        if not chosen_discount:
            # Look for active discounts valid on as_of_date
            candidates = db.query(Discount).filter(
                Discount.is_active.is_(True),
                Discount.start_date <= as_of_date,
                Discount.end_date >= as_of_date,
                Discount.times_used < Discount.usage_limit
            ).all()
            for disc in candidates:
                if PricingService.is_discount_eligible(disc, overall_subtotal, total_quantity, items):
                    chosen_discount = disc
                    break

        # 3. Apply discount if eligible
        overall_discount_total = 0
        if chosen_discount and PricingService.is_discount_eligible(chosen_discount, overall_subtotal, total_quantity, items):
            if chosen_discount.scope == "subscription":
                # Subscription-wide discount
                if chosen_discount.kind == "percent":
                    disc_pct = Decimal(str(chosen_discount.value))
                    overall_discount_total = quantize_paise(Decimal(overall_subtotal) * disc_pct / Decimal("100"))
                else:  # fixed
                    overall_discount_total = min(chosen_discount.value, overall_subtotal)
                
                # Apportion discount proportionally across lines to calculate taxes accurately
                remaining_discount = overall_discount_total
                for i, lb in enumerate(line_breakdowns):
                    if overall_subtotal > 0:
                        if i == len(line_breakdowns) - 1:
                            # last line gets remaining difference to avoid rounding loss
                            line_disc = remaining_discount
                        else:
                            ratio = Decimal(lb["line_subtotal"]) / Decimal(overall_subtotal)
                            line_disc = quantize_paise(Decimal(overall_discount_total) * ratio)
                            line_disc = min(line_disc, remaining_discount)
                            remaining_discount -= line_disc
                    else:
                        line_disc = 0
                    
                    lb["discount"] = line_disc
                    lb["taxable_amount"] = lb["line_subtotal"] - line_disc

            elif chosen_discount.scope == "product":
                # Product-specific discount
                matching_lines = [lb for lb in line_breakdowns if lb["item"].product.id == chosen_discount.product_id]
                matching_subtotal = sum(lb["line_subtotal"] for lb in matching_lines)
                if matching_lines and matching_subtotal > 0:
                    if chosen_discount.kind == "percent":
                        disc_pct = Decimal(str(chosen_discount.value))
                        product_discount_total = quantize_paise(Decimal(matching_subtotal) * disc_pct / Decimal("100"))
                    else:
                        product_discount_total = min(chosen_discount.value, matching_subtotal)
                    
                    remaining_disc = product_discount_total
                    for i, lb in enumerate(matching_lines):
                        if i == len(matching_lines) - 1:
                            line_disc = remaining_disc
                        else:
                            ratio = Decimal(lb["line_subtotal"]) / Decimal(matching_subtotal)
                            line_disc = quantize_paise(Decimal(product_discount_total) * ratio)
                            line_disc = min(line_disc, remaining_disc)
                            remaining_disc -= line_disc
                        lb["discount"] = line_disc
                        lb["taxable_amount"] = lb["line_subtotal"] - line_disc
                    
                    overall_discount_total = product_discount_total

        # 4. Calculate taxes on post-discount taxable amount per line
        overall_tax_total = 0
        for lb in line_breakdowns:
            taxable = lb["taxable_amount"]
            tax_rate = lb["tax_rate"]
            if tax_rate > 0 and taxable > 0:
                line_tax = quantize_paise(Decimal(taxable) * tax_rate / Decimal("100"))
            else:
                line_tax = 0
            lb["tax"] = line_tax
            lb["total"] = taxable + line_tax
            overall_tax_total += line_tax

        overall_taxable_amount = overall_subtotal - overall_discount_total
        final_total = overall_taxable_amount + overall_tax_total

        return {
            "base_amount": overall_base_amount,
            "variant_extra": overall_variant_extra,
            "subtotal": overall_subtotal,
            "discount_total": overall_discount_total,
            "applied_discount": chosen_discount,
            "taxable_amount": overall_taxable_amount,
            "tax_total": overall_tax_total,
            "total": final_total,
            "lines": line_breakdowns
        }

    @staticmethod
    def is_discount_eligible(
        discount: Discount,
        subtotal: int,
        total_quantity: int,
        items: List[PricingLineItem]
    ) -> bool:
        if not discount.is_active:
            return False
        if discount.times_used >= discount.usage_limit:
            return False
        
        if discount.scope == "subscription":
            if subtotal < discount.min_amount:
                return False
            if total_quantity < discount.min_qty:
                return False
            return True
        elif discount.scope == "product":
            matching = [it for it in items if it.product.id == discount.product_id]
            if not matching:
                return False
            matching_qty = sum(it.quantity for it in matching)
            matching_amount = sum(
                (it.unit_price_override if it.unit_price_override is not None else (it.product.sales_price + (it.variant.price_extra if it.variant else 0))) * it.quantity
                for it in matching
            )
            if matching_qty < discount.min_qty:
                return False
            if matching_amount < discount.min_amount:
                return False
            return True
        return False
