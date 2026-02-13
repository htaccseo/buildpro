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
            <div className="bg-white dark:bg-bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-navy-900 dark:text-text-main">
                        {existingReminder ? 'Edit Reminder' : 'New Reminder'}
                    </h3>
                    {existingReminder && (
                        <button
                            onClick={handleDelete}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            title="Delete Reminder"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-navy-900 dark:text-text-main mb-1">Reminder Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-navy-900 dark:text-text-main placeholder:text-slate-400"
                            placeholder="e.g., Call supplier"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-900 dark:text-text-main mb-1">Details (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-navy-900 dark:text-text-main placeholder:text-slate-400 min-h-[80px]"
                            placeholder="Add details..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-900 dark:text-text-main mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-navy-900 dark:text-text-main [color-scheme:light] dark:[color-scheme:dark]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-900 dark:text-text-main mb-1">Assign To</label>
                        <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-navy-900 dark:text-text-main appearance-none"
                        >
                            <option value="">Select User...</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>

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
                            {existingReminder ? 'Save Changes' : 'Create Reminder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
