import React, { useState, useEffect } from 'react';
import { X, Calendar, AlignLeft, Type } from 'lucide-react';
import type { Task } from '../lib/types';


interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (taskData: Partial<Task>) => void;
    initialData?: Task | null;
    title: string;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requiredDate: ''
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                title: initialData.title,
                description: initialData.description,
                requiredDate: initialData.requiredDate
            });
        } else if (isOpen) {
            setFormData({
                title: '',
                description: '',
                requiredDate: ''
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-navy-900 leading-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-navy-900 flex items-center gap-2">
                            <Type className="w-4 h-4 text-emerald-600" />
                            Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                            placeholder="e.g. Install Windows"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-navy-900 flex items-center gap-2">
                            <AlignLeft className="w-4 h-4 text-emerald-600" />
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 h-32 resize-none"
                            placeholder="Details about the task..."
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-navy-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={formData.requiredDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, requiredDate: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-navy-900 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-lg shadow-emerald-500/20 transition-colors"
                        >
                            {initialData ? 'Save Changes' : 'Create Requirement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
