import { useState } from 'react';
import { useStore } from '../lib/store';
import { Card } from '../components/ui/Card';
import { User, Mail, Shield, Camera, Phone, Save, Briefcase } from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import type { UserRole } from '../lib/types';

export function Settings() {
    const { currentUser, updateUser, logout } = useStore();

    // Form State
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [company, setCompany] = useState(currentUser?.company || '');
    const [role, setRole] = useState<UserRole>(currentUser?.role || 'builder');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    if (!currentUser) return null;

    const handleSave = () => {
        if (newPassword && newPassword !== confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        setIsSaving(true);
        // Simulate API delay
        setTimeout(() => {
            const updatedUser = {
                ...currentUser,
                name,
                email,
                phone,
                company,
                role
            };

            // Only update password if provided (mock)
            if (newPassword) {
                // In a real app we'd validate currentPassword here
                updatedUser.password = newPassword;
            }

            updateUser(updatedUser);

            // Reset password fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setIsSaving(false);
            alert("Settings updated successfully!");
        }, 800);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-navy-900 mb-2">Settings</h1>
                <p className="text-text-muted">Manage your profile and account preferences.</p>
            </div>

            <div className="max-w-3xl space-y-6">
                <Card className="p-8 border-none shadow-sm">
                    <h2 className="text-xl font-bold text-navy-900 mb-6">Profile Information</h2>

                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative group cursor-pointer">
                            <UserAvatar userId={currentUser.id} className="w-24 h-24 text-3xl shadow-sm" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-navy-900">{name || currentUser.name}</h3>
                            <p className="text-text-muted capitalize">{role}</p>
                        </div>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-2">Company Name</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            placeholder="Acme Construction"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-2">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            placeholder="+61 ..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-2">Role</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as UserRole)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                                        >
                                            <option value="builder">Builder</option>
                                            <option value="worker">Worker</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Section */}
                        <div className="pt-6 border-t border-slate-100">
                            <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-500" />
                                Security
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-full md:col-span-2">
                                    <label className="block text-sm font-medium text-navy-900 mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        placeholder="Enter current password to change"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                            <button
                                type="button"
                                onClick={logout}
                                className="text-rose-500 hover:text-rose-600 font-medium px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors"
                            >
                                Sign Out
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-70"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
