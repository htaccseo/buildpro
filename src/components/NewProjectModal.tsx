import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Project } from '../lib/types';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectToEdit?: Project;
}

const PROJECT_COLORS = [
    { id: 'emerald', class: 'bg-gradient-to-br from-emerald-500 to-teal-600', label: 'Emerald' },
    { id: 'blue', class: 'bg-gradient-to-br from-blue-500 to-indigo-600', label: 'Blue' },
    { id: 'violet', class: 'bg-gradient-to-br from-violet-500 to-purple-600', label: 'Violet' },
    { id: 'amber', class: 'bg-gradient-to-br from-amber-500 to-orange-600', label: 'Amber' },
    { id: 'rose', class: 'bg-gradient-to-br from-rose-500 to-pink-600', label: 'Rose' },
    { id: 'slate', class: 'bg-gradient-to-br from-slate-700 to-slate-800', label: 'Dark Slate' },
];

export function NewProjectModal({ isOpen, onClose, projectToEdit }: ProjectModalProps) {
    const { addProject, updateProject } = useStore();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0].class);

    useEffect(() => {
        if (projectToEdit) {
            setName(projectToEdit.name);
            setAddress(projectToEdit.address);
            setClientName(projectToEdit.clientName);
            setClientEmail(projectToEdit.clientEmail || '');
            setClientPhone(projectToEdit.clientPhone || '');
            setStartDate(projectToEdit.startDate);
            setEndDate(projectToEdit.endDate);
            setSelectedColor(projectToEdit.color || PROJECT_COLORS[0].class);
        } else {
            // Reset fields for new project
            setName('');
            setAddress('');
            setClientName('');
            setClientEmail('');
            setClientPhone('');
            setStartDate('');
            setEndDate('');
            setSelectedColor(PROJECT_COLORS[0].class);
        }
    }, [projectToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (projectToEdit) {
            updateProject({
                ...projectToEdit,
                name,
                address,
                clientName,
                clientEmail,
                clientPhone,
                startDate,
                endDate,
                color: selectedColor
            });
        } else {
            addProject({
                id: Math.random().toString(36).substr(2, 9),
                name,
                address,
                clientName,
                clientEmail,
                clientPhone,
                status: 'active',
                progress: 0,
                startDate,
                endDate,
                color: selectedColor,
                tasks: []
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-navy-900">{projectToEdit ? 'Edit Project' : 'New Project'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-navy-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Project Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wider">Project Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1.5">Project Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="e.g. Modern Villa Renovation"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1.5">Site Address</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="e.g. 123 Ocean Drive, Sydney"
                                required
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Branding/Color Selection */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wider">Project Theme</h3>
                        <div className="grid grid-cols-6 gap-2">
                            {PROJECT_COLORS.map((color) => (
                                <button
                                    key={color.id}
                                    type="button"
                                    onClick={() => setSelectedColor(color.class)}
                                    className={cn(
                                        "w-full aspect-square rounded-full relative flex items-center justify-center transition-transform hover:scale-110",
                                        color.class,
                                        selectedColor === color.class && "ring-2 ring-offset-2 ring-emerald-500 scale-110"
                                    )}
                                    title={color.label}
                                >
                                    {selectedColor === color.class && <Check className="w-4 h-4 text-white" />}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-text-muted">Select a color theme for the project dashboard.</p>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Client Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wider">Client Information</h3>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1.5">Client Name</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="e.g. Mr. Smith"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                    placeholder="client@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1.5">Phone</label>
                                <input
                                    type="tel"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                    placeholder="+61 ..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Timeline */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wider">Timeline</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1.5">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-navy-700 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 transition-all"
                        >
                            {projectToEdit ? 'Save Changes' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
