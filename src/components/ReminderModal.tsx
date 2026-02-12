import React from 'react';
import { useStore } from '../lib/store';
import type { Reminder } from '../lib/types';
import { Trash2 } from 'lucide-react';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
    existingReminder?: Reminder | null;
}

export function ReminderModal({ isOpen, onClose, initialDate, existingReminder }: ReminderModalProps) {
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [date, setDate] = React.useState('');
    const [assignedTo, setAssignedTo] = React.useState('');
    const [completed, setCompleted] = React.useState(false);
    const { addReminder, updateReminder, deleteReminder, users, currentUser } = useStore();

    React.useEffect(() => {
        if (isOpen) {
            if (existingReminder) {
                setTitle(existingReminder.title);
                setDescription(existingReminder.description || '');
                setDate(existingReminder.date);
                setAssignedTo(existingReminder.assignedTo || '');
                setCompleted(existingReminder.completed);
            } else {
                setTitle('');
                setDescription('');
                setDate(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                setAssignedTo(currentUser?.id || '');
                setCompleted(false);
            }
        }
    }, [isOpen, initialDate, existingReminder]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (existingReminder) {
            updateReminder({
                ...existingReminder,
                title,
                description,
                date,
                assignedTo,
                completed,
                completedBy: completed ? (existingReminder.completedBy || currentUser?.id) : undefined
            });
        } else {
            addReminder({
                id: Math.random().toString(36).substr(2, 9),
                title,
                description,
                date,
                assignedTo,
                completed: false
            });
        }
        onClose();
    };

    const handleDelete = () => {
        if (existingReminder) {
            deleteReminder(existingReminder.id);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-navy-900">
                        {existingReminder ? 'Edit Reminder' : 'New Reminder'}
                    </h3>
                    {existingReminder && (
                        <button
                            onClick={handleDelete}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50"
                            title="Delete Reminder"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Reminder Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none"
                            placeholder="e.g., Call supplier"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none h-24 resize-none"
                            placeholder="Details..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Assign To</label>
                        <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none"
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
                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Due Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none"
                            required
                        />
                    </div>

                    {existingReminder && (
                        <div
                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer"
                            onClick={() => {
                                const newCompleted = !completed;
                                setCompleted(newCompleted);
                                // We don't have direct access to setCompletedBy here, but we pass it effectively on submit
                            }}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                                {completed && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                            </div>
                            <span className={`text-sm font-medium ${completed ? 'text-navy-900' : 'text-slate-600'}`}>
                                {completed ? 'Completed' : 'Mark as Completed'}
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
                            className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                        >
                            {existingReminder ? 'Save Changes' : 'Add Reminder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
