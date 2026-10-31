// Brightloop Administration: Staff Management
import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Search,
  CheckCircle2,
  Lock,
  Mail,
  UserCheck,
  Power,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from 'src/services/apiClient';
import { useAuth } from 'src/context/AuthContext';
import { User, UserRole } from 'src/types';
import { formatDate } from 'src/utils/calculations';
import { toast } from 'sonner';

export const StaffManagementPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff' as 'admin' | 'staff',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getStaff();
      setStaffList(data);
    } catch (err: any) {
      toast.error('Failed to load staff list from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only administrators can create staff accounts');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createStaff(formData);
      toast.success(`Staff member ${formData.name} added successfully`);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: 'staff', password: '' });
      loadStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create staff account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: User) => {
    if (!isAdmin) return;
    try {
      const updated = await apiClient.toggleStaffStatus(String(member.id));
      setStaffList(prev =>
        prev.map(s => (s.id === member.id ? { ...s, is_active: (updated as any).is_active } : s))
      );
      toast.success(
        `User ${member.name} is now ${(updated as any).is_active ? 'active' : 'deactivated'}`
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              <Lock className="w-3 h-3" /> Admin Restricted
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage internal team members, assign operational roles, activate/deactivate accounts and view user details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStaff}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {isAdmin ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Invite New Staff
            </button>
          ) : (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Viewing in read-only mode (Staff role)
            </div>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredStaff.length} internal team member{filteredStaff.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{member.email}</td>
                  <td className="py-3.5 px-4">
                    {member.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                        <Shield className="w-3 h-3" /> Administrator
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        <Users className="w-3 h-3" /> Operations Staff
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">{formatDate(member.created_at)}</td>
                  <td className="py-3.5 px-4 text-center">
                    {(member as any).is_active !== false ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {isAdmin && String(member.id) !== String(user?.id) && (
                      <button
                        onClick={() => handleToggleStatus(member)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition cursor-pointer ${
                          (member as any).is_active !== false
                            ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title="Toggle active status"
                      >
                        <Power className="w-3 h-3" />
                        {(member as any).is_active !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Add Staff Account</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="maya@brightloop.io"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Initial Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Defaults to StaffPassword@2026"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Access Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                >
                  <option value="staff">Internal Staff (Sales, Subscriptions, Billing, Payments)</option>
                  <option value="admin">Administrator (Full Access + Staff & Pricing Guardrails)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
