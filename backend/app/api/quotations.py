from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.quotation import QuotationTemplate, QuotationTemplateLine
from app.models.plan import Plan
from app.models.product import Product, Variant
from app.models.user import User
from app.schemas.quotation import (
    QuotationTemplateCreate,
    QuotationTemplateResponse,
    QuotationTemplateLineResponse
)
from app.core.permissions import require_staff_or_admin

router = APIRouter(prefix="/quotation-templates", tags=["Quotation Templates"])


@router.get("", response_model=List[QuotationTemplateResponse])
def list_quotation_templates(
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    templates = db.query(QuotationTemplate).order_by(desc(QuotationTemplate.created_at)).all()
    results = []
    for t in templates:
        lines = []
        for l in t.lines:
            lines.append(QuotationTemplateLineResponse(
                id=l.id,
                template_id=l.template_id,
                product_id=l.product_id,
                variant_id=l.variant_id,
                quantity=l.quantity,
                unit_price_override=l.unit_price_override,
                product_name=l.product.name if l.product else None,
                variant_value=l.variant.value if l.variant else None
            ))
        results.append(QuotationTemplateResponse(
            id=t.id,
            name=t.name,
            plan_id=t.plan_id,
            plan_name=t.plan.name if t.plan else None,
            validity_days=t.validity_days,
            created_by=t.created_by,
            created_at=t.created_at,
            lines=lines
        ))
    return results


@router.post("", response_model=QuotationTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_quotation_template(
    data: QuotationTemplateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    plan = db.query(Plan).filter(Plan.id == data.plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found."
        )

    # Validate all products and variants
    for line in data.lines:
        prod = db.query(Product).filter(Product.id == line.product_id).first()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product ID {line.product_id} not found."
            )
        if line.variant_id:
            variant = db.query(Variant).filter(Variant.id == line.variant_id).first()
            if not variant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Variant ID {line.variant_id} not found."
                )
            if variant.product_id != prod.id:
                raise HTTPException(
                    status_code=422,
                    detail="The selected variant does not belong to the selected product."
                )

    template = QuotationTemplate(
        name=data.name.strip(),
        plan_id=plan.id,
        validity_days=data.validity_days,
        created_by=user.id
    )
    db.add(template)
    db.flush()

    for line in data.lines:
        t_line = QuotationTemplateLine(
            template_id=template.id,
            product_id=line.product_id,
            variant_id=line.variant_id,
            quantity=line.quantity,
            unit_price_override=line.unit_price_override
        )
        db.add(t_line)

    db.commit()
    db.refresh(template)

    lines_resp = []
    for l in template.lines:
        lines_resp.append(QuotationTemplateLineResponse(
            id=l.id,
            template_id=l.template_id,
            product_id=l.product_id,
            variant_id=l.variant_id,
            quantity=l.quantity,
            unit_price_override=l.unit_price_override,
            product_name=l.product.name if l.product else None,
            variant_value=l.variant.value if l.variant else None
        ))

    return QuotationTemplateResponse(
        id=template.id,
        name=template.name,
        plan_id=template.plan_id,
        plan_name=template.plan.name if template.plan else None,
        validity_days=template.validity_days,
        created_by=template.created_by,
        created_at=template.created_at,
        lines=lines_resp
    )
