import React from 'react';
import { useStore } from '../lib/store';
import type { Meeting } from '../lib/types';
import { Check, Trash2 } from 'lucide-react';

interface NewMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
    meeting?: Meeting | null;
}

export function NewMeetingModal({ isOpen, onClose, initialDate, meeting }: NewMeetingModalProps) {
    const [title, setTitle] = React.useState('');
    const [date, setDate] = React.useState('');
    const [time, setTime] = React.useState('');
    const [address, setAddress] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [assignedTo, setAssignedTo] = React.useState('');
    const [isCompleted, setIsCompleted] = React.useState(false);
    const { addMeeting, updateMeeting, deleteMeeting, users, currentUser } = useStore();

    React.useEffect(() => {
        if (isOpen) {
            if (meeting) {
                setTitle(meeting.title);
                setDate(meeting.date);
                setTime(meeting.time);
                setAddress(meeting.address || '');
                setDescription(meeting.description || '');
                setAssignedTo(meeting.assignedTo || '');
                setIsCompleted(meeting.completed);
            } else {
                setTitle('');
                setDate(initialDate ? initialDate.toISOString().split('T')[0] : '');
                setTime('');
                setAddress('');
                setDescription('');
                setAssignedTo(currentUser?.id || '');
                setIsCompleted(false);
            }
        }
    }, [isOpen, initialDate, currentUser, meeting]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (meeting) {
            updateMeeting({
                ...meeting,
                title,
                date,
                time,
                address,
                description,
                assignedTo: assignedTo || undefined,
                completed: isCompleted,
                completedBy: isCompleted && !meeting.completed ? currentUser?.id : (isCompleted ? meeting.completedBy : undefined)
            });
        } else {
            addMeeting({
                id: Math.random().toString(36).substr(2, 9),
                title,
                date,
                time,
                address,
                description,
                assignedTo: assignedTo || undefined,
                completed: isCompleted,
                attendees: [],
                createdBy: currentUser?.id
            });
        }
        onClose();
    };

    const handleDelete = () => {
        if (meeting && confirm('Delete this meeting?')) {
            deleteMeeting(meeting.id);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-navy-900 dark:text-text-main">
                        {meeting ? 'Edit Meeting' : 'New Meeting'}
                    </h3>
                    {meeting && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            title="Delete Meeting"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-navy-900 dark:text-text-main mb-1">Title</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-navy-900 dark:text-text-main placeholder:text-slate-400"
                            placeholder="Meeting title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-navy-900 dark:text-text-main mb-1">Date</label>
                            <input
                                type="date"
                                required
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-navy-900 dark:text-text-main [color-scheme:light] dark:[color-scheme:dark]"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 dark:text-text-main mb-1">Time</label>
                            <input
                                type="time"
                                required
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-navy-900 dark:text-text-main [color-scheme:light] dark:[color-scheme:dark]"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-900 dark:text-text-main mb-1">Location</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-navy-900 dark:text-text-main placeholder:text-slate-400"
                            placeholder="Address or link"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-900 dark:text-text-main mb-1">Description</label>
                        <textarea
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-navy-900 dark:text-text-main placeholder:text-slate-400 min-h-[80px]"
                            placeholder="Meeting details..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-900 dark:text-text-main mb-1">Assign To</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-navy-900 dark:text-text-main appearance-none"
                            value={assignedTo}
                            onChange={e => setAssignedTo(e.target.value)}
                        >
                            <option value="">Select user...</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>

                    {meeting && (
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCompleted(!isCompleted)}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isCompleted
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20 shadow-lg'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <Check className="w-4 h-4" />
                                {isCompleted ? 'Completed' : 'Mark as Complete'}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 font-medium transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-navy-900 dark:bg-emerald-600 text-white hover:bg-navy-800 dark:hover:bg-emerald-500 font-medium transition-all shadow-lg shadow-navy-900/20 text-sm"
                        >
                            {meeting ? 'Save Changes' : 'Create Meeting'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
