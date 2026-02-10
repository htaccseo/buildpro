import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { useOrganizationData } from '../lib/hooks';
import { Phone, Mail, Users, Plus, Briefcase, Shield, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { InviteMemberModal } from '../components/InviteMemberModal';

export function Team() {
    const { users, projects } = useOrganizationData();
    const { currentUser } = useStore();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Filter users from the same company
    // Ensure current user is in the list if they have the same org ID (which they should)
    // The hook `useOrganizationData` returns users filtered by current org.
    // We just need to make sure we display them correctly.

    // Debug: check if current user is in the list
    const currentUserInList = users.find(u => u.id === currentUser?.id);
    const teamMembers = currentUserInList ? users : (currentUser ? [...users, currentUser] : users);

    // Helper to get user tasks (if they are a worker)
    const getUserTasks = (userId: string) => {
        return projects.flatMap(p =>
            (p.tasks || [])
                .filter(t => t.assignedTo === userId)
                .map(t => ({ ...t, projectName: p.name }))
        );
    };

    if (!currentUser?.company) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-navy-900">No Company Associated</h2>
                <p className="text-text-muted max-w-md"> Please update your profile settings to add a company name to see your team members.</p>
                <div className="flex gap-4">
                    <Link to="/settings" className="px-4 py-2 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors">Go to Settings</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-navy-900 mb-2">Team Members</h1>
                    <p className="text-text-muted">People at <span className="font-semibold text-navy-700">{currentUser.company}</span></p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            if (currentUser?.email) {
                                // Re-fetch data instead of hard reset
                                const { fetchData } = useStore.getState();
                                fetchData(currentUser.email);
                            } else {
                                window.location.reload();
                            }
                        }}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors"
                        title="Refresh Data"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    {/* Check for admin or super admin logic if needed, currently assumes isAdmin flag */}
                    {(currentUser?.isAdmin || currentUser?.role === 'builder') && (
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Invite Member</span>
                        </button>
                    )}
                </div>
            </div>

            {teamMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Users className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-navy-900">No Team Members Found</h3>
                        <p className="text-text-muted max-w-sm mx-auto mt-1">
                            You are the only member of "{currentUser.company}" so far.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teamMembers.map(member => {
                        const tasks = getUserTasks(member.id);
                        const activeTasks = tasks.filter(t => t.status !== 'completed');
                        const isCurrentUser = member.id === currentUser.id;

                        return (
                            <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-sm flex flex-col">
                                <div className="p-6 border-b border-slate-50 bg-white">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} alt={member.name} className="w-14 h-14 rounded-full object-cover ring-4 ring-slate-50" />
                                                {isCurrentUser && (
                                                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">YOU</span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-navy-900">{member.name}</h3>
                                                <span className="text-sm text-emerald-600 font-medium capitalize">{member.role}</span>
                                            </div>
                                        </div>
                                        {member.role === 'worker' && (
                                            <div className={cn("px-2.5 py-1 rounded-full text-xs font-bold", activeTasks.length > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500")}>
                                                {activeTasks.length} Active Tasks
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex gap-3">
                                        <a
                                            href={`tel:${member.phone || ''}`}
                                            className={cn(
                                                "flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                                                member.phone ? "hover:bg-slate-50" : "opacity-50 cursor-not-allowed bg-slate-50"
                                            )}
                                            onClick={e => !member.phone && e.preventDefault()}
                                        >
                                            <Phone className="w-4 h-4" />
                                            Call
                                        </a>
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="flex-1 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </a>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 bg-slate-50/50">
                                    {member.role === 'worker' ? (
                                        <>
                                            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Briefcase className="w-3 h-3" />
                                                Current Assignments
                                            </h4>
                                            {activeTasks.length === 0 ? (
                                                <p className="text-sm text-text-muted italic">No active tasks assigned.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {activeTasks.slice(0, 3).map(task => (
                                                        <div key={task.id} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm text-sm">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <span className="font-medium text-navy-900 line-clamp-1">{task.title}</span>
                                                            </div>
                                                            <p className="text-text-muted text-xs truncate">{task.projectName}</p>
                                                        </div>
                                                    ))}
                                                    {activeTasks.length > 3 && (
                                                        <p className="text-xs text-center text-emerald-600 font-medium pt-1">+{activeTasks.length - 3} more tasks</p>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                            <Shield className="w-8 h-8 text-slate-300 mb-2" />
                                            <p className="text-sm text-navy-900 font-medium">Project Manager</p>
                                            <p className="text-xs text-text-muted">Has full access to all projects</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />
        </div>
    );
}
