import { useState } from 'react';
import { useStore } from '../lib/store';
import { Card } from '../components/ui/Card';
import { Users, Building, Trash2, Ban, CheckCircle, Search, TrendingUp } from 'lucide-react';

export function SuperAdminDashboard() {
    const { users, organizations, deleteOrganization, updateOrganizationStatus } = useStore();
    const [activeTab, setActiveTab] = useState<'orgs' | 'users' | 'stats'>('orgs');
    const [searchTerm, setSearchTerm] = useState('');

    // Stats Calculations
    const totalRevenue = organizations.length * 299; // Mock calculation
    const activeOrgs = organizations.filter(o => o.status === 'active').length;

    // Filtering
    const filteredOrgs = organizations.filter(o =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-navy-900 mb-2">Super Admin Dashboard</h1>
                <p className="text-text-muted">Manage the entire SaaS platform.</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('orgs')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'orgs' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}
                >
                    Organizations
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}
                >
                    Users
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'stats' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}
                >
                    Stats
                </button>
            </div>

            {/* Organizations Tab */}
            {activeTab === 'orgs' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search organizations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <Card className="p-6 border-none shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-sm text-text-muted">
                                        <th className="py-3 px-2">Name</th>
                                        <th className="py-3 px-2">Created At</th>
                                        <th className="py-3 px-2">Status</th>
                                        <th className="py-3 px-2">Subscription</th>
                                        <th className="py-3 px-2">Users</th>
                                        <th className="py-3 px-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredOrgs.map(org => {
                                        const orgUsers = users.filter(u => u.organizationId === org.id);
                                        return (
                                            <tr key={org.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                <td className="py-3 px-2 font-medium text-navy-900">{org.name}</td>
                                                <td className="py-3 px-2 text-slate-500">{new Date(org.createdAt).toLocaleDateString()}</td>
                                                <td className="py-3 px-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${org.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {org.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="capitalize text-slate-600">{org.subscriptionStatus || 'trial'}</span>
                                                </td>
                                                <td className="py-3 px-2 text-slate-500">{orgUsers.length}</td>
                                                <td className="py-3 px-2 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => updateOrganizationStatus(org.id, org.status === 'active' ? 'suspended' : 'active')}
                                                            className={`p-1.5 rounded-lg transition-colors ${org.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                            title={org.status === 'active' ? 'Suspend' : 'Activate'}
                                                        >
                                                            {org.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
                                                                    deleteOrganization(org.id);
                                                                }
                                                            }}
                                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                    </div>

                    <Card className="p-6 border-none shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-sm text-text-muted">
                                        <th className="py-3 px-2">User</th>
                                        <th className="py-3 px-2">Role</th>
                                        <th className="py-3 px-2">Organization</th>
                                        <th className="py-3 px-2">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredUsers.map(user => {
                                        const org = organizations.find(o => o.id === user.organizationId);
                                        return (
                                            <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center gap-3">
                                                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                                        <span className="font-medium text-navy-900">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 capitalize text-slate-500">{user.role}</td>
                                                <td className="py-3 px-2 text-navy-900 font-medium">{org?.name || 'Unknown'}</td>
                                                <td className="py-3 px-2 text-slate-500">{user.email}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 border-none shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Building className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-muted">Total Organizations</p>
                            <h3 className="text-2xl font-bold text-navy-900">{organizations.length}</h3>
                            <p className="text-xs text-emerald-600 font-medium mt-1">
                                {activeOrgs} active
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6 border-none shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-muted">Total Users</p>
                            <h3 className="text-2xl font-bold text-navy-900">{users.length}</h3>
                        </div>
                    </Card>

                    <Card className="p-6 border-none shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-muted">Total ARR (Est.)</p>
                            <h3 className="text-2xl font-bold text-navy-900">${(totalRevenue * 12).toLocaleString()}</h3>
                            <p className="text-xs text-slate-400 mt-1">Based on mock pricing</p>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
