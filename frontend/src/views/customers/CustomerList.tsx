// Brightloop Customer Management
import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import { Customer, Invoice, PaymentRecord, Subscription } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import {
  Users,
  Search,
  Plus,
  Building,
  Mail,
  Phone,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Eye,
  FileText,
  Repeat,
  CreditCard,
  History,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent } from 'src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from 'src/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { Label } from 'src/components/ui/label';
import { toast } from 'sonner';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);

  // Selected customer for detail drawer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Add/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [cList, sList, iList, pList] = await Promise.all([
        apiClient.getCustomers(),
        apiClient.getSubscriptions(),
        apiClient.getInvoices(),
        apiClient.getPayments(),
      ]);
      setCustomers(cList);
      setSubscriptions(sList);
      setInvoices(iList);
      setPayments(pList);
    } catch {
      toast.error('Failed to load customer directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      status: 'active',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (customer: Customer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      address: customer.address || '',
      status: customer.status,
    });
    setIsDialogOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        const updated = await apiClient.updateCustomer(editingCustomer.id, formData);
        setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
        if (selectedCustomer?.id === updated.id) setSelectedCustomer(updated);
        toast.success(`Updated details for ${updated.name}`);
      } else {
        const created = await apiClient.createCustomer(formData);
        setCustomers(prev => [created, ...prev]);
        toast.success(`New customer ${created.name} registered`);
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  };

  // Customer Drawer Related Entities
  const customerSubscriptions = useMemo(() => {
    if (!selectedCustomer) return [];
    return subscriptions.filter(s => s.customer_id === selectedCustomer.id);
  }, [selectedCustomer, subscriptions]);

  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return [];
    return invoices.filter(i => i.customer_id === selectedCustomer.id);
  }, [selectedCustomer, invoices]);

  const customerPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    return payments.filter(p => p.customer_id === selectedCustomer.id);
  }, [selectedCustomer, payments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Customer Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage enterprise accounts, subscriber billing profiles, outstanding balances, and activity timelines.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs h-9"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, company, or email..."
              className="text-xs pl-9 h-8 bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Inactive</option>
          </select>
          <span className="text-muted-foreground text-xs font-medium">
            Showing <strong className="text-foreground">{filteredCustomers.length}</strong> clients
          </span>
        </div>
      </div>

      {/* Customer Listing Table */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer / Company</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold text-center">Active Subs</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Invoiced</th>
                  <th className="py-3 px-4 font-semibold text-right">Outstanding</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="hover:bg-secondary/40 transition cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                          <span>{customer.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
                          <Building className="w-3.5 h-3.5" />
                          <span>{customer.company}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="font-mono text-xs font-semibold px-2">
                          {customer.active_subscriptions}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                        {formatCurrency(customer.total_billed)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {customer.outstanding_balance > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400">
                            {formatCurrency(customer.outstanding_balance)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">₹0.00</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={customer.status === 'active' ? 'default' : 'secondary'}
                          className="text-[10px] capitalize px-2 py-0"
                        >
                          {customer.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedCustomer(customer);
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md"
                            title="View Customer Profile Drawer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => handleOpenEdit(customer, e)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                            title="Edit Customer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No customers match your filter query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Drawer */}
      <Sheet open={!!selectedCustomer} onOpenChange={open => !open && setSelectedCustomer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-6 overflow-y-auto">
          {selectedCustomer && (
            <div className="space-y-6">
              <SheetHeader className="pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-lg font-bold text-foreground">
                      {selectedCustomer.name}
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5" />
                      {selectedCustomer.company}
                    </p>
                  </div>
                  <Badge variant={selectedCustomer.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {selectedCustomer.status}
                  </Badge>
                </div>
              </SheetHeader>

              {/* Balance Summary Header Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <span className="text-[11px] text-muted-foreground font-medium block">Total Billed</span>
                  <span className="text-base font-bold font-mono text-foreground">
                    {formatCurrency(selectedCustomer.total_billed)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <span className="text-[11px] text-amber-800 dark:text-amber-400 font-medium block">
                    Outstanding Balance
                  </span>
                  <span className="text-base font-bold font-mono text-amber-700 dark:text-amber-400">
                    {formatCurrency(selectedCustomer.outstanding_balance)}
                  </span>
                </div>
              </div>

              {/* Tabs for customer information */}
              <Tabs defaultValue="subscriptions" className="w-full">
                <TabsList className="grid grid-cols-4 w-full h-9">
                  <TabsTrigger value="subscriptions" className="text-xs">
                    Subs ({customerSubscriptions.length})
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="text-xs">
                    Invoices ({customerInvoices.length})
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs">
                    Payments ({customerPayments.length})
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="text-xs">
                    Contact Info
                  </TabsTrigger>
                </TabsList>

                {/* Subscriptions Tab */}
                <TabsContent value="subscriptions" className="space-y-3 pt-3">
                  {customerSubscriptions.length > 0 ? (
                    customerSubscriptions.map(sub => (
                      <div key={sub.id} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                        <div>
                          <div className="font-mono font-bold text-blue-600 text-xs">{sub.number}</div>
                          <div className="font-semibold text-xs text-foreground mt-0.5">{sub.plan_name}</div>
                          <div className="text-[11px] text-muted-foreground">Expires: {formatDate(sub.expiry_date)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-foreground text-xs">{formatCurrency(sub.total)}</div>
                          <Badge variant="outline" className="capitalize text-[10px] mt-1">
                            {sub.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">No subscriptions linked to this customer.</div>
                  )}
                </TabsContent>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="space-y-3 pt-3">
                  {customerInvoices.length > 0 ? (
                    customerInvoices.map(inv => (
                      <div key={inv.id} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                        <div>
                          <div className="font-mono font-bold text-blue-600 text-xs">{inv.number}</div>
                          <div className="text-[11px] text-muted-foreground">Due: {formatDate(inv.due_date)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-foreground text-xs">{formatCurrency(inv.total)}</div>
                          <Badge
                            variant={inv.status === 'paid' ? 'default' : inv.status === 'confirmed' ? 'outline' : 'secondary'}
                            className="capitalize text-[10px] mt-1"
                          >
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">No invoices generated for this customer.</div>
                  )}
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments" className="space-y-3 pt-3">
                  {customerPayments.length > 0 ? (
                    customerPayments.map(pay => (
                      <div key={pay.id} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                        <div>
                          <div className="font-mono font-semibold text-foreground text-xs">{pay.payment_reference}</div>
                          <div className="text-[11px] text-muted-foreground">{formatDate(pay.paid_on)} via {pay.method.toUpperCase()}</div>
                        </div>
                        <div className="font-mono font-bold text-emerald-600 text-xs">
                          +{formatCurrency(pay.amount)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">No payments recorded for this customer.</div>
                  )}
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-3 pt-3 text-xs">
                  <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-2">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Email Address</span>
                      <span className="font-medium text-foreground">{selectedCustomer.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Phone Number</span>
                      <span className="font-medium text-foreground">{selectedCustomer.phone || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Billing Address</span>
                      <span className="font-medium text-foreground leading-relaxed">{selectedCustomer.address || 'Standard Registered Office'}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(selectedCustomer)} className="text-xs">
                  Edit Profile
                </Button>
                <Button size="sm" onClick={() => setSelectedCustomer(null)} className="text-xs">
                  Done
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Customer Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingCustomer ? 'Edit Customer Details' : 'Register New Customer'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCustomer} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Full Contact Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Vikram Malhotra"
                className="text-xs h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Company / Enterprise *</Label>
              <Input
                required
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Apex Logistics Global"
                className="text-xs h-9 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Email Address *</Label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="vikram@apex.in"
                  className="text-xs h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98112 34567"
                  className="text-xs h-9 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Billing Address</Label>
              <Input
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Cyber City, Phase 2, Gurugram"
                className="text-xs h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Account Status</Label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                {editingCustomer ? 'Update Customer' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerList;
