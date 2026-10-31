// Brightloop Customer Portal: Profile
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Shield,
  Edit,
  Save,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { apiClient } from 'src/services/apiClient';
import { useAuth } from 'src/context/AuthContext';
import { Customer } from 'src/types';
import { toast } from 'sonner';

export const PortalProfile: React.FC = () => {
  const { user } = useAuth();
  const customerId = user?.customer_id || 'cust-1';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    address: '',
  });

  const loadProfile = async () => {
    try {
      const customers = await apiClient.getCustomers();
      const match = customers.find((c) => c.id === customerId) || customers[0];
      if (match) {
        setCustomer(match);
        setFormData({
          name: match.name,
          phone: match.phone || '+91 98765 43210',
          company: match.company || 'TechCorp India Pvt Ltd',
          address: match.address || '402, High-Tech Park, Whitefield, Bengaluru 560066',
        });
      }
    } catch (err: any) {
      toast.error('Failed to load profile');
    }
  };

  useEffect(() => {
    loadProfile();
  }, [customerId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    try {
      const updated = await apiClient.updateCustomer(customer.id, formData);
      setCustomer(updated);
      setIsEditing(false);
      toast.success('Company profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!customer?.email) return;
    try {
      await apiClient.forgotPassword(customer.email);
      toast.success('Password reset link dispatched! (Inspect in the Outbox module)');
    } catch (err: any) {
      toast.error('Failed to dispatch reset request');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Company & Billing Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your organization's legal name, primary billing contact, and registered invoice address.
        </p>
      </div>

      {customer && (
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-xl shadow-md">
                  {customer.company ? customer.company.charAt(0) : customer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{customer.company}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Primary Contact: {customer.name}</p>
                </div>
              </div>

              <div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Details
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold uppercase">Billing Email</span>
                      <strong className="text-slate-800">{customer.email}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold uppercase">Telephone</span>
                      <strong className="text-slate-800">{customer.phone || '+91 98765 43210'}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold uppercase">Legal Business Entity</span>
                      <strong className="text-slate-800">{customer.company}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold uppercase">Tax Address</span>
                      <strong className="text-slate-800">
                        {customer.address || '402, High-Tech Park, Whitefield, Bengaluru 560066'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Credentials / Security Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-600" />
              Security & Authentication
            </h3>
            <p className="text-xs text-slate-500">
              Brightloop protects your account with zero-knowledge password token hashing.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRequestPasswordReset}
                className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Request Password Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalProfile;
