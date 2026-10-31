// Brightloop Subscription Listing & Lifecycle Management
import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import { Customer, Subscription, SubscriptionPlan, SubscriptionStatus } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import {
  Repeat,
  Search,
  Filter,
  Plus,
  Eye,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent } from 'src/components/ui/card';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

export const SubscriptionList: React.FC = () => {
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, custs, pls] = await Promise.all([
        apiClient.getSubscriptions(),
        apiClient.getCustomers(),
        apiClient.getPlans(),
      ]);
      setSubscriptions(subs);
      setCustomers(custs);
      setPlans(pls);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      const matchSearch =
        s.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customer_company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchPlan = planFilter === 'all' || s.plan_id === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [subscriptions, searchQuery, statusFilter, planFilter]);

  const handlePause = async (sub: Subscription) => {
    try {
      await apiClient.pauseSubscription(sub.id);
      setSubscriptions(prev =>
        prev.map(item => (item.id === sub.id ? { ...item, status: 'paused' } : item))
      );
      toast.success(`Subscription ${sub.number} paused`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleResume = async (sub: Subscription) => {
    try {
      await apiClient.transitionSubscriptionStatus(sub.id, 'active');
      setSubscriptions(prev =>
        prev.map(item => (item.id === sub.id ? { ...item, status: 'active' } : item))
      );
      toast.success(`Subscription ${sub.number} resumed to Active`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleRenew = async (sub: Subscription) => {
    try {
      const renewed = await apiClient.renewSubscription(sub.id);
      setSubscriptions(prev => [renewed, ...prev]);
      toast.success(`Generated renewed subscription ${renewed.number}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Renewal failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="w-6 h-6 text-blue-600" />
            Active Subscriptions & Contracts
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage subscriber recurring contracts, billing cycles, automated status machines, and renewals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/renewal-radar">
            <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5 border-teal-300 text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/20 cursor-pointer">
              <Radio className="w-4 h-4 text-teal-600" />
              <span>N5 Renewal Radar</span>
            </Button>
          </Link>

          <Link to="/quotations">
            <Button className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs h-9">
              <Plus className="w-4 h-4" />
              New Subscription Quote
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search subscription #, client, or enterprise..."
              className="text-xs pl-9 h-8 bg-background"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">All States</option>
            <option value="active">Active Only</option>
            <option value="confirmed">Confirmed</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
            <option value="quotation">Quotation</option>
          </select>

          {/* Plan filter */}
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">All Plans</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <span className="text-muted-foreground text-xs font-medium">
            Showing <strong className="text-foreground">{filteredSubscriptions.length}</strong> subscriptions
          </span>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Subscription #</th>
                  <th className="py-3 px-4 font-semibold">Subscriber & Enterprise</th>
                  <th className="py-3 px-4 font-semibold">Plan Cadence</th>
                  <th className="py-3 px-4 font-semibold">Dates & Cycles</th>
                  <th className="py-3 px-4 font-semibold text-right">Cadence Total</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubscriptions.length > 0 ? (
                  filteredSubscriptions.map(sub => (
                    <tr
                      key={sub.id}
                      onClick={() => navigate(`/subscriptions/${sub.id}`)}
                      className="hover:bg-secondary/30 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        <Link to={`/subscriptions/${sub.id}`} className="hover:underline">
                          {sub.number}
                        </Link>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <span>{sub.customer_company}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">{sub.customer_name}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{sub.plan_name}</div>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold mt-0.5">
                          {sub.billing_period}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-muted-foreground font-medium">
                        <div>Next Bill: <strong className="text-foreground">{formatDate(sub.next_billing_date)}</strong></div>
                        <div>Expires: <span className="text-foreground">{formatDate(sub.expiry_date)}</span></div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-base text-foreground">
                        {formatCurrency(sub.total)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            sub.status === 'active'
                              ? 'default'
                              : sub.status === 'confirmed'
                              ? 'outline'
                              : sub.status === 'paused'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="text-[10px] capitalize px-2 py-0"
                        >
                          {sub.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div
                          className="flex items-center justify-center gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          <Link to={`/subscriptions/${sub.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md"
                              title="View Subscription Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          {sub.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={sub.plan_pausable === false}
                              onClick={() => handlePause(sub)}
                              className={`h-7 w-7 rounded-md ${
                                sub.plan_pausable !== false
                                  ? 'text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                  : 'opacity-30 cursor-not-allowed'
                              }`}
                              title={
                                sub.plan_pausable !== false
                                  ? 'Pause Subscription'
                                  : 'Plan does not permit pausing'
                              }
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {sub.status === 'paused' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResume(sub)}
                              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md"
                              title="Resume Subscription"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {sub.plan_renewable !== false && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRenew(sub)}
                              className="h-7 w-7 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-md"
                              title="Renew Subscription"
                            >
                              <Repeat className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No subscriptions match the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionList;
