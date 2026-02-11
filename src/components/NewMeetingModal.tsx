import React from 'react';
import { useStore } from '../lib/store';

interface NewMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
}

export function NewMeetingModal({ isOpen, onClose, initialDate }: NewMeetingModalProps) {
    const [title, setTitle] = React.useState('');
    const [date, setDate] = React.useState('');
    const [time, setTime] = React.useState('');
    const [address, setAddress] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [assignedTo, setAssignedTo] = React.useState('');
    const { addMeeting, users, currentUser } = useStore();

    React.useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDate(initialDate ? initialDate.toISOString().split('T')[0] : '');
            setTime('');
            setAddress('');
            setDescription('');
            setAssignedTo(currentUser?.id || '');
        }
    }, [isOpen, initialDate, currentUser]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addMeeting({
            id: Math.random().toString(36).substr(2, 9),
            title,
            date,
            time,
            address,
            description,
            assignedTo,
            completed: false,
            attendees: []
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-navy-900 mb-4">New Meeting</h3>
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
