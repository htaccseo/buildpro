import React from 'react';
import { useStore } from '../lib/store';
import { useOrganizationData } from '../lib/hooks';
import { isSameDay } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Clock, MapPin, X, Check } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { NewMeetingModal } from '../components/NewMeetingModal';
import { ReminderModal } from '../components/ReminderModal';
import { UserAvatar } from '../components/UserAvatar';
import type { Reminder, OtherMatter, Meeting } from '../lib/types';

export function Dashboard() {
    const navigate = useNavigate();
    const [isMeetingModalOpen, setIsMeetingModalOpen] = React.useState(false);
    const [selectedMeeting, setSelectedMeeting] = React.useState<Meeting | null>(null);
    // Reminder State
    const [selectedReminder, setSelectedReminder] = React.useState<Reminder | null>(null);
    const [isReminderModalOpen, setIsReminderModalOpen] = React.useState(false);

    // Other Matters State
    const [isMatterModalOpen, setIsMatterModalOpen] = React.useState(false);
    const [matterToEdit, setMatterToEdit] = React.useState<OtherMatter | null>(null);
    const [matterTitle, setMatterTitle] = React.useState('');
    const [matterAddress, setMatterAddress] = React.useState('');
    const [matterNote, setMatterNote] = React.useState('');
    const [matterAssignedTo, setMatterAssignedTo] = React.useState('');

    // Use Clean Data Hook (RLS)
    const { projects, invoices, meetings, reminders, otherMatters, users } = useOrganizationData();
    // Use Store actions (actions are safe to use from store directly as they usually just dispatch)
    // Actually, our store actions need currentOrgId from store state, which is fine.
    // The previous code destructured methods from useStore. Let's keep doing that for actions.
    const { addOtherMatter, updateOtherMatter, deleteOtherMatter, deleteMeeting, updateMeeting, currentUser } = useStore();

    const allTasks = projects.flatMap(p => p.tasks);

    // Combine Project Tasks (Due/Overdue) and Manual Reminders (Due/Overdue)
    // Combine Project Tasks (Due/Overdue) and Manual Reminders (Due/Overdue/Today)
    // Combine Project Tasks (Due/Overdue) and Manual Reminders (Due/Overdue/Today)
    // Show tasks if: (Pending AND Due <= Today) OR (Completed AND Completed Today)
    const dueProjectTasks = allTasks.filter(t => {
        const isDue = t.status === 'pending' && new Date(t.requiredDate) <= new Date();
        const isCompletedToday = t.status === 'completed' && t.completedAt && isSameDay(new Date(t.completedAt), new Date());
        return isDue || isCompletedToday;
    });
    // Show reminders if they are not completed OR if they are completed but were due today/recently (so they don't disappear immediately)
    // Actually, user wants them to NOT disappear. Let's show all due/past reminders, sorted by status (pending first).
    const dueReminders = reminders
        .filter(r => {
            // Fix: Compare dates string-wise using local time to avoid timezone issues.
            // new Date().toLocaleDateString('en-CA') returns YYYY-MM-DD in local time
            const todayStr = new Date().toLocaleDateString('en-CA');
            return r.date <= todayStr || r.completed; // Show past/today due OR completed
        })
        .sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1; // Pending first
        });

    // constant 'highPriorityTasks' is replaced by a combined list logic in render, or we can unify them for display.
    // Let's keep them separate sections or combined? User asked to "Add Daily Reminders".
    // I will combine them visually in the list.

    const upcomingMeetings = meetings.filter(m => new Date(m.date) >= new Date(new Date().setHours(0, 0, 0, 0))).slice(0, 3); // Today onwards



    const openMeetingModal = (meeting?: Meeting) => {
        if (meeting) {
            setSelectedMeeting(meeting);
        } else {
            setSelectedMeeting(null);
        }
        setIsMeetingModalOpen(true);
    };

    const handleAddOtherMatter = (e: React.FormEvent) => {
        e.preventDefault();

        if (matterToEdit) {
            updateOtherMatter({
                ...matterToEdit,
                title: matterTitle,
                address: matterAddress,
                note: matterNote,
                assignedTo: matterAssignedTo || undefined
            });
        } else {
            addOtherMatter({
                id: Math.random().toString(36).substr(2, 9),
                title: matterTitle,
                address: matterAddress,
                note: matterNote,
                assignedTo: matterAssignedTo || undefined,
                date: new Date().toISOString(),
                createdBy: currentUser?.id || 'unknown'
            });
        }
        setIsMatterModalOpen(false);
        setMatterToEdit(null);
        setMatterTitle('');
        setMatterAddress('');
        setMatterNote('');
        setMatterAssignedTo('');
    };

    const openMatterModal = (matter?: OtherMatter) => {
        if (matter) {
            setMatterToEdit(matter);
            setMatterTitle(matter.title);
            setMatterAddress(matter.address || '');
            setMatterNote(matter.note || '');
            setMatterAssignedTo(matter.assignedTo || '');
        } else {
            setMatterToEdit(null);
            setMatterTitle('');
            setMatterAddress('');
            setMatterNote('');
            setMatterAssignedTo('');
        }
        setIsMatterModalOpen(true);
    };

    // Get current user for greeting
    // const { currentUser } = useStore(); // This line is now redundant as currentUser is destructured above

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div>
                <h1 className="text-3xl font-bold text-navy-900 mb-2">Welcome back, {currentUser?.name?.split(' ')[0] || 'Builder'}</h1>
                <p className="text-text-muted">Here's what's happening across your projects today.</p>
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Daily Reminders - Priority Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-navy-900">Daily Reminders</h2>
                            <button
                                onClick={() => {
                                    setSelectedReminder(null);
                                    setIsReminderModalOpen(true);
                                }}
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                            >
                                + Add Reminder
                            </button>
                        </div>
                        <Card className="p-4 space-y-4 h-auto border-none shadow-sm bg-white rounded-xl">
                            {dueProjectTasks.length === 0 && dueReminders.length === 0 ? (
                                <div className="text-center py-10 text-text-muted sm">No urgent tasks or reminders.</div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Manual Reminders */}
                                    {/* Manual Reminders */}
                                    {dueReminders.map(reminder => (
                                        <div
                                            key={reminder.id}
                                            className={cn(
                                                "p-4 rounded-xl border flex gap-4 hover:shadow-sm transition-all group cursor-pointer",
                                                reminder.completed
                                                    ? "bg-slate-50 border-slate-100 opacity-75"
                                                    : "bg-indigo-50 border-indigo-100"
                                            )}
                                            onClick={() => {
                                                setSelectedReminder(reminder);
                                                setIsReminderModalOpen(true);
                                            }}
                                        >
                                            <div
                                                className={cn(
                                                    "w-1 h-12 rounded-full transition-colors shrink-0",
                                                    reminder.completed ? "bg-slate-300" : "bg-indigo-500"
                                                )}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className={cn("font-medium text-navy-900 truncate", reminder.completed && "line-through text-text-muted")} title={reminder.title}>
                                                        {reminder.title}
                                                    </h4>
                                                    <div className="flex items-center gap-1">
                                                        {reminder.assignedTo && (
                                                            <UserAvatar userId={reminder.assignedTo} className="ring-2 ring-white" />
                                                        )}
                                                    </div>
                                                </div>
                                                {reminder.description && (
                                                    <div className="group/desc relative">
                                                        <p className={cn("text-sm mt-0.5 line-clamp-2", reminder.completed ? "text-text-muted" : "text-navy-600")} title={reminder.description}>
                                                            {reminder.description}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-sm text-text-muted">Personal Reminder • {formatDate(reminder.date, 'MMM d')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Project Tasks */}
                                    {/* Project Tasks */}
                                    {dueProjectTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={cn(
                                                "p-4 rounded-xl border flex gap-4 hover:shadow-sm transition-all group cursor-pointer",
                                                task.status === 'completed'
                                                    ? "bg-slate-50 border-slate-100 opacity-75"
                                                    : "bg-amber-50 border-amber-100/50" // Differentiate from personal reminders (indigo)
                                            )}
                                            onClick={() => navigate(`/projects/${task.projectId}`)}
                                        >
                                            <div
                                                className={cn(
                                                    "w-1 h-12 rounded-full transition-colors shrink-0",
                                                    task.status === 'completed' ? "bg-slate-300" : "bg-amber-500"
                                                )}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className={cn("font-medium text-navy-900 truncate", task.status === 'completed' && "line-through text-text-muted")}>
                                                        {task.title}
                                                    </h4>
                                                    {/* Task assignment avatar handles the 'who' part naturally, createdBy not strictly needed here but could be added if requested for tasks too */}
                                                </div>
                                                {task.description && (
                                                    <p className={cn("text-sm mt-0.5 line-clamp-2", task.status === 'completed' ? "text-text-muted" : "text-navy-600")}>
                                                        {task.description}
                                                    </p>
                                                )}
                                                <p className="text-sm text-text-muted mt-1">Project Task • Due: {formatDate(task.requiredDate, 'MMM d')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Active Projects List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-navy-900">Active Projects</h2>
                            <Link to="/projects" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">View All</Link>
                        </div>

                        <div className="grid gap-4">
                            {projects.filter(p => p.status === 'active').map(project => (
                                <Link key={project.id} to={`/projects/${project.id}`} className="block">
                                    <Card className="p-4 sm:p-5 flex flex-row items-center justify-between gap-0 sm:gap-6 hover:shadow-md transition-all cursor-pointer group border-none shadow-sm h-full relative">
                                        <div className={cn("w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-inner shrink-0 mr-3 sm:mr-0", project.color)}>
                                            <Activity className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-navy-900 truncate mb-1 pr-0 sm:pr-0">{project.name}</h3>
                                            <p className="text-sm text-text-muted truncate flex items-center gap-1">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{project.address}</span>
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end sm:items-end gap-0 sm:gap-2 shrink-0 ml-2 sm:ml-0">
                                            <span className="text-sm font-medium text-navy-600">{project.progress}%</span>
                                            <div className="hidden sm:block w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${project.progress}%` }} />
                                            </div>
                                        </div>

                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Side Column */}
                <div className="space-y-6">
                    {/* Meetings Widget */}
                    <h2 className="text-xl font-bold text-navy-900">Upcoming Meetings</h2>
                    <Card className="p-5 border-none shadow-sm space-y-4 rounded-xl">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-text-muted">Schedule</span>
                            <button
                                onClick={() => openMeetingModal()}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                            >
                                + Add Meeting
                            </button>
                        </div>
                        {upcomingMeetings.length === 0 ? (
                            <div className="text-center py-6 text-sm text-text-muted">No upcoming meetings.</div>
                        ) : (
                            upcomingMeetings.map(meeting => (
                                <div
                                    key={meeting.id}
                                    onClick={() => openMeetingModal(meeting)}
                                    className="group relative flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 pr-8 cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this meeting?')) {
                                                deleteMeeting(meeting.id);
                                            }
                                        }}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                        title="Delete Meeting"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="flex-col flex items-center justify-center w-12 h-12 bg-white rounded-lg border border-slate-100 shadow-sm shrink-0">
                                        <span className="text-xs font-bold text-emerald-600 uppercase">{formatDate(meeting.date, 'MMM')}</span>
                                        <span className="text-lg font-bold text-navy-900 leading-none">{formatDate(meeting.date, 'd')}</span>
                                    </div>
                                    <div className="min-w-0 flex-1 group/title relative">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={cn(
                                                        "w-4 h-4 rounded-full border-2 cursor-pointer transition-colors flex items-center justify-center",
                                                        meeting.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-500"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateMeeting({ ...meeting, completed: !meeting.completed, completedBy: !meeting.completed ? currentUser?.id : undefined });
                                                    }}
                                                    title={meeting.completed ? "Mark as incomplete" : "Mark as done"}
                                                >
                                                    {meeting.completed && <Check className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                                <h4 className={cn("font-bold text-navy-900 truncate pr-4 cursor-help max-w-[150px]", meeting.completed && "line-through text-text-muted")} title={meeting.title}>
                                                    {meeting.title}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {meeting.assignedTo && (
                                                    <UserAvatar userId={meeting.assignedTo} />
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-text-muted flex items-center gap-1.5 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {meeting.time}
                                            {meeting.address && (
                                                <>
                                                    <span className="mx-1">•</span>
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate max-w-[120px]">{meeting.address}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <Link to="/schedule" className="block text-center text-xs font-medium text-slate-400 hover:text-navy-900 transition-colors pt-2">
                            View Full Schedule
                        </Link>
                    </Card>

                    <h2 className="text-xl font-bold text-navy-900 pt-2">Financial Overview</h2>
                    <Card className="p-5 border-none shadow-sm space-y-4 rounded-xl">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-text-muted">Pending Invoices</span>
                            <Link to="/invoices" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">View All</Link>
                        </div>

                        {invoices.filter(i => i.status === 'pending' || i.status === 'overdue').slice(0, 3).map(inv => (
                            <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex gap-3 items-center">
                                    <div className={cn("w-1.5 h-10 rounded-full", inv.type === 'received' ? "bg-rose-500" : "bg-emerald-500")} />
                                    <div>
                                        <p className="font-bold text-navy-900 text-sm truncate w-24">{inv.clientName}</p>
                                        <p className="text-xs text-text-muted">{formatDate(inv.dueDate, 'MMM d')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn("font-bold", inv.type === 'received' ? "text-rose-600" : "text-emerald-600")}>
                                        ${inv.amount.toLocaleString()}
                                    </p>
                                    <p className={cn("text-xs font-medium", inv.status === 'overdue' ? "text-rose-500" : "text-amber-600")}>
                                        {inv.status === 'overdue' ? 'Overdue' : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {invoices.filter(i => i.status === 'pending' || i.status === 'overdue').length === 0 && (
                            <div className="text-center py-6 text-sm text-text-muted">No pending invoices.</div>
                        )}
                    </Card>

                    <h2 className="text-xl font-bold text-navy-900 pt-2">General Notes</h2>
                    <Card className="p-5 border-none shadow-sm space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-sm font-medium text-text-muted">Notes</span>
                            <button
                                onClick={() => openMatterModal()}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                            >
                                + Add Note
                            </button>
                        </div>

                        {otherMatters && otherMatters.length > 0 ? (
                            otherMatters.map(matter => (
                                <div
                                    key={matter.id}
                                    onClick={() => openMatterModal(matter)}
                                    className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 cursor-pointer hover:shadow-md transition-all relative"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Creator Avatar (Left) */}
                                            <UserAvatar userId={matter.createdBy} />

                                            {/* Note Title */}
                                            <h4 className="font-bold text-navy-900 truncate">
                                                {matter.title}
                                            </h4>
                                        </div>

                                        {/* Assignee Avatar (Right) */}
                                        {matter.assignedTo && (
                                            <div className="shrink-0">
                                                <UserAvatar userId={matter.assignedTo} className="ring-2 ring-white" />
                                            </div>
                                        )}
                                    </div>

                                    {matter.address && (
                                        <div className="flex items-center gap-1.5 text-sm text-navy-700">
                                            <MapPin className="w-3.5 h-3.5 text-amber-500/70" />
                                            {matter.address}
                                        </div>
                                    )}
                                    <p className="text-sm text-navy-600 bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                        {matter.note}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-sm text-text-muted">No notes yet.</div>
                        )}
                    </Card>
                </div>
            </div >

            {/* New Meeting Modal */}
            {/* New Meeting Modal */}
            <NewMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                meeting={selectedMeeting}
            />

            {/* Reminder Modal (Add/Edit) */}
            <ReminderModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                existingReminder={selectedReminder}
            />

            {/* New Other Matter Modal */}
            {
                isMatterModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-navy-900 mb-4">{matterToEdit ? 'Edit Note' : 'New Note'}</h3>
                            <form onSubmit={handleAddOtherMatter} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Title</label>
                                    <input
                                        type="text"
                                        value={matterTitle}
                                        onChange={(e) => setMatterTitle(e.target.value)}
                                        className="w-full px-4 py-2 rounded-full bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none"
                                        placeholder="e.g., Brick Calculation"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Assign To</label>
                                    <select
                                        value={matterAssignedTo}
                                        onChange={(e) => setMatterAssignedTo(e.target.value)}
                                        className="w-full px-4 py-2 rounded-full bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none"
                                    >
                                        <option value="">Select User...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.id === currentUser?.id ? `${u.name} (Me)` : u.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Address (Optional)</label>
                                    <input
                                        type="text"
                                        value={matterAddress}
                                        onChange={(e) => setMatterAddress(e.target.value)}
                                        className="w-full px-4 py-2 rounded-full bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none"
                                        placeholder="e.g., 123 Site St"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Note</label>
                                    <textarea
                                        value={matterNote}
                                        onChange={(e) => setMatterNote(e.target.value)}
                                        className="w-full px-4 py-3 rounded-full bg-slate-50 border border-slate-200 focus:border-amber-500 outline-none min-h-[100px] resize-none"
                                        placeholder="e.g., Need 5000 bricks..."
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    {matterToEdit && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this note?')) {
                                                    deleteOtherMatter(matterToEdit.id);
                                                    setIsMatterModalOpen(false);
                                                }
                                            }}
                                            className="px-4 py-2 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50"
                                        >
                                            Delete
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsMatterModalOpen(false)}
                                        className="flex-1 px-4 py-2 rounded-full border border-slate-200 text-navy-900 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                                    >
                                        {matterToEdit ? 'Save Changes' : 'Add Note'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
