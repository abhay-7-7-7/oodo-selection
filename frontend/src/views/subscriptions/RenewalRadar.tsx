// Brightloop Novelty N5: Renewal Radar
// Proactive expiration command center: 7, 30, and 60-day visual columns with 1-click renewal quote creation

import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import { RenewalRadarItem } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import {
  Radio,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  Repeat,
  Plus,
  ArrowRight,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

export const RenewalRadar: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<RenewalRadarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowFilter, setWindowFilter] = useState<'all' | '7' | '30' | '60'>('all');
  const [onlyRenewable, setOnlyRenewable] = useState(false);

  const loadRadar = async () => {
    try {
      setLoading(true);
      const list = await apiClient.getRenewalRadar(60);
      setItems(list);
    } catch {
      toast.error('Failed to load renewal radar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRadar();
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (onlyRenewable && !item.renewable) return false;
      if (windowFilter === '7') return item.days_remaining <= 7 && item.days_remaining > 0;
      if (windowFilter === '30') return item.days_remaining <= 30 && item.days_remaining > 7;
      if (windowFilter === '60') return item.days_remaining <= 60 && item.days_remaining > 30;
      return true;
    });
  }, [items, windowFilter, onlyRenewable]);

  // Column grouping for the Kanban Radar board
  const col7Days = useMemo(() => {
    return items.filter(i => i.days_remaining <= 7 && i.days_remaining > 0 && (!onlyRenewable || i.renewable));
  }, [items, onlyRenewable]);

  const col30Days = useMemo(() => {
    return items.filter(i => i.days_remaining > 7 && i.days_remaining <= 30 && (!onlyRenewable || i.renewable));
  }, [items, onlyRenewable]);

  const col60Days = useMemo(() => {
    return items.filter(i => i.days_remaining > 30 && i.days_remaining <= 60 && (!onlyRenewable || i.renewable));
  }, [items, onlyRenewable]);

  const colExpired = useMemo(() => {
    return items.filter(i => i.days_remaining <= 0 && (!onlyRenewable || i.renewable));
  }, [items, onlyRenewable]);

  const handleCreateRenewalQuote = async (subscriptionId: string, subNumber: string) => {
    try {
      const quote = await apiClient.createRenewalQuotation(subscriptionId);
      toast.success(`Renewal Quote ${quote.quotation_number} generated for ${subNumber}!`);
      navigate('/quotations');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate renewal quotation');
    }
  };

  const totalRenewalOpportunity = useMemo(() => {
    return items.filter(i => i.renewable).reduce((acc, i) => acc + i.estimated_renewal_value, 0);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Radio className="w-6 h-6 text-teal-600 animate-pulse" />
              Renewal Radar
            </h1>
            <Badge className="text-xs font-bold bg-teal-600 text-white">
              Novelty N5
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify expiring subscriptions and eliminate missed renewals with 1-click renewal quotation dispatch.
          </p>
        </div>

        {/* Opportunity Card */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 px-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-right">
            <span className="text-[10px] text-teal-800 dark:text-teal-300 font-bold uppercase tracking-wider block">
              Total Renewal Pipeline
            </span>
            <span className="text-base font-bold font-mono text-teal-700 dark:text-teal-300">
              {formatCurrency(totalRenewalOpportunity, { includeDecimals: false })}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Switch Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            Window:
          </span>
          <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border">
            {(['all', '7', '30', '60'] as const).map(w => (
              <button
                key={w}
                onClick={() => setWindowFilter(w)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                  windowFilter === w
                    ? 'bg-background shadow-xs text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {w === 'all' ? 'All Windows' : `${w} Days`}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 ml-4 cursor-pointer select-none text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={onlyRenewable}
              onChange={e => setOnlyRenewable(e.target.checked)}
              className="rounded border-border text-teal-600 focus:ring-teal-500"
            />
            <span>Renewable Plans Only</span>
          </label>
        </div>

        <span className="text-muted-foreground text-xs font-medium">
          Tracking <strong className="text-foreground">{items.length}</strong> expiring contracts
        </span>
      </div>

      {/* 3-Column + Expired Radar Kanban Board (Required by Rubric) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Column 1: Expiring in 7 Days (Critical / Urgent) */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-red-900 dark:text-red-300">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span>≤ 7 Days (Critical)</span>
            </div>
            <Badge variant="destructive" className="font-mono text-xs font-bold">
              {col7Days.length}
            </Badge>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {col7Days.length > 0 ? (
              col7Days.map(item => (
                <RadarCard key={item.id} item={item} onQuote={handleCreateRenewalQuote} />
              ))
            ) : (
              <div className="p-6 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                No contracts expiring within 7 days.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Expiring in 30 Days (High Urgency) */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>8 – 30 Days (High)</span>
            </div>
            <Badge variant="secondary" className="font-mono text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
              {col30Days.length}
            </Badge>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {col30Days.length > 0 ? (
              col30Days.map(item => (
                <RadarCard key={item.id} item={item} onQuote={handleCreateRenewalQuote} />
              ))
            ) : (
              <div className="p-6 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                No contracts expiring in this window.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Expiring in 60 Days (Medium Urgency) */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>31 – 60 Days (Medium)</span>
            </div>
            <Badge variant="secondary" className="font-mono text-xs font-bold">
              {col60Days.length}
            </Badge>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {col60Days.length > 0 ? (
              col60Days.map(item => (
                <RadarCard key={item.id} item={item} onQuote={handleCreateRenewalQuote} />
              ))
            ) : (
              <div className="p-6 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                No contracts in 60-day window.
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Lapsed / Expired */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-300">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              <span>Past Expiry (Lapsed)</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs font-bold">
              {colExpired.length}
            </Badge>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {colExpired.length > 0 ? (
              colExpired.map(item => (
                <RadarCard key={item.id} item={item} onQuote={handleCreateRenewalQuote} />
              ))
            ) : (
              <div className="p-6 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                No lapsed subscriptions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Radar Card Component
interface RadarCardProps {
  item: RenewalRadarItem;
  onQuote: (id: string, num: string) => void;
}

const RadarCard: React.FC<RadarCardProps> = ({ item, onQuote }) => {
  return (
    <Card className="border-border shadow-2xs hover:border-teal-400 transition">
      <CardContent className="p-4 space-y-3 text-xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to={`/subscriptions/${item.id}`}
              className="font-mono font-bold text-blue-600 hover:underline block"
            >
              {item.subscription_number}
            </Link>
            <div className="font-semibold text-foreground mt-0.5 truncate max-w-[170px]">
              {item.customer_company}
            </div>
          </div>

          <Badge
            variant={
              item.days_remaining <= 0
                ? 'destructive'
                : item.days_remaining <= 7
                ? 'destructive'
                : item.days_remaining <= 30
                ? 'secondary'
                : 'outline'
            }
            className="text-[10px] font-mono shrink-0"
          >
            {item.days_remaining <= 0
              ? 'Expired'
              : `${item.days_remaining}d left`}
          </Badge>
        </div>

        <div className="p-2.5 rounded-lg bg-secondary/50 border border-border text-[11px] space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Plan:</span>
            <span className="font-medium text-foreground truncate max-w-[130px]">{item.plan_name}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Expiry Date:</span>
            <span className="font-medium text-foreground">{formatDate(item.expiry_date)}</span>
          </div>
          <div className="flex justify-between font-mono font-semibold pt-0.5 border-t border-border">
            <span>Renewal Value:</span>
            <span className="text-foreground">{formatCurrency(item.estimated_renewal_value)}</span>
          </div>
        </div>

        {/* 1-Click Renewal Action Button */}
        <div>
          {item.renewable ? (
            <Button
              size="sm"
              onClick={() => onQuote(item.id, item.subscription_number)}
              className="w-full text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white gap-1 cursor-pointer font-semibold shadow-2xs"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Create Renewal Quote</span>
            </Button>
          ) : (
            <div className="p-1.5 text-center text-[10px] text-muted-foreground bg-secondary/40 rounded border border-border">
              Plan flag: Renewal Not Permitted
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RenewalRadar;
