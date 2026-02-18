import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import type { ProjectUpdate } from '../lib/types';


interface ProjectUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (message: string) => void;
    initialData?: ProjectUpdate | null;
    title: string;
}

export const ProjectUpdateModal: React.FC<ProjectUpdateModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title
}) => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen && initialData) {
            setMessage(initialData.message);
        } else if (isOpen) {
            setMessage('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSubmit(message);
            onClose();
        }
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
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                            Update Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 h-40 resize-none text-base"
                            placeholder="What's the latest progress..."
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-navy-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-600/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            {initialData ? 'Save Changes' : 'Post Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
