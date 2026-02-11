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
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-navy-900">
                        {meeting ? 'Edit Meeting' : 'New Meeting'}
                    </h3>
                    {meeting && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50"
                            title="Delete Meeting"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                            placeholder="e.g., Client Briefing"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1.5">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1.5">Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Address (Optional)</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                            placeholder="e.g., 123 Construction Ave"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none h-24 resize-none"
                            placeholder="Details..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Assign To</label>
                        <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                        >
                            <option value="">Select User...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.id === currentUser?.id ? `${u.name} (Me)` : u.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {meeting && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer" onClick={() => setIsCompleted(!isCompleted)}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                                {isCompleted && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`font-medium ${isCompleted ? 'text-emerald-600' : 'text-navy-700'}`}>
                                {isCompleted ? 'Marked as Completed' : 'Mark as Completed'}
                            </span>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-navy-900 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                        >
                            Add Meeting
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
