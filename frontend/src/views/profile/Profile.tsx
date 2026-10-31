// Brightloop User Profile Management (Admin & Staff)
import React, { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { apiClient } from 'src/services/apiClient';
import {
  User as UserIcon,
  Mail,
  Building,
  Phone,
  Shield,
  KeyRound,
  CheckCircle2,
  Lock,
  Save,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { toast } from 'sonner';
import { formatDate } from 'src/utils/calculations';

export const ProfilePage: React.FC = () => {
  const { user, role } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCompany(user.company || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSavingProfile(true);
    try {
      await apiClient.updateProfile({ name, phone, company });
      toast.success('Profile details updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 9) {
      toast.error('New password must be at least 9 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await apiClient.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-blue-600" />
          My Profile & Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal details, credentials, and view system role privileges.
        </p>
      </div>

      {/* User Summary Banner */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'BL'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user?.name || 'Brightloop User'}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {user?.email || 'user@brightloop.io'}
              </span>
              {user?.company && (
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  {user.company}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="capitalize px-3 py-1 text-xs">
            <Shield className="w-3.5 h-3.5 mr-1" />
            {role} Access
          </Badge>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="details">Personal Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="permissions">Role & Permissions</TabsTrigger>
        </TabsList>

        {/* Tab 1: Personal Details */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>
                Update your contact details and organizational affiliation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="prof-name">Full Name *</Label>
                  <Input
                    id="prof-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prof-email">Email Address</Label>
                  <Input
                    id="prof-email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Email address is tied to authentication and cannot be changed directly.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prof-phone">Phone Number</Label>
                  <Input
                    id="prof-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prof-company">Company / Organization</Label>
                  <Input
                    id="prof-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Brightloop Software Pvt Ltd"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={savingProfile} className="gap-2">
                    <Save className="w-4 h-4" />
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>
                Ensure your account is protected with a strong, complex passphrase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="cur-pass">Current Password *</Label>
                  <Input
                    id="cur-pass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-pass">New Password *</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimum 9 characters (uppercase, lowercase, numbers, symbols)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pass">Confirm New Password *</Label>
                  <Input
                    id="confirm-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={changingPassword} className="gap-2">
                    <KeyRound className="w-4 h-4" />
                    {changingPassword ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Permissions */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role Privileges & Scopes</CardTitle>
              <CardDescription>
                Overview of functional permissions granted to your account in this deployment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground capitalize">
                      {role} Access Rights
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {role === 'admin'
                        ? 'Unrestricted administrative control including product catalog management, pricing rules, tax tables, staff provisioning, and billing engine execution.'
                        : 'Operational staff permissions including quotation drafting, customer management, subscription lifecycle tracking, invoice auditing, and payment receipt recording.'}
                    </p>
                  </div>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-3">Module</th>
                        <th className="p-3">Read</th>
                        <th className="p-3">Write / Create</th>
                        <th className="p-3">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-3 font-medium">Customer Management</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Allowed</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Allowed</td>
                        <td className="p-3 text-muted-foreground">—</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Product Catalog & Pricing</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Allowed</td>
                        <td className="p-3 font-semibold">
                          {role === 'admin' ? (
                            <span className="text-emerald-600">✓ Allowed</span>
                          ) : (
                            <span className="text-red-500">✕ Admin Only</span>
                          )}
                        </td>
                        <td className="p-3">
                          {role === 'admin' ? 'Full DDL & Rate changes' : 'Read-only catalog'}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Subscriptions & Quotations</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Allowed</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Allowed</td>
                        <td className="p-3 text-emerald-600">State machine transitions</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Invoicing & Billing Runs</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Allowed</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Allowed</td>
                        <td className="p-3 text-emerald-600">Batch billing execution</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Payments & Collections</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Allowed</td>
                        <td className="p-3 text-emerald-600 font-semibold">✓ Allowed</td>
                        <td className="p-3 text-emerald-600">Record settlements</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Staff & User Management</td>
                        <td className="p-3 font-semibold">
                          {role === 'admin' ? (
                            <span className="text-emerald-600">✓ Allowed</span>
                          ) : (
                            <span className="text-red-500">✕ Admin Only</span>
                          )}
                        </td>
                        <td className="p-3 font-semibold">
                          {role === 'admin' ? (
                            <span className="text-emerald-600">✓ Allowed</span>
                          ) : (
                            <span className="text-red-500">✕ Admin Only</span>
                          )}
                        </td>
                        <td className="p-3">
                          {role === 'admin' ? 'Invite & toggle status' : 'No access'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
