import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, AlignLeft, Type, Camera, Image as ImageIcon } from 'lucide-react';
import { resizeImage } from '../lib/utils';
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
        requiredDate: '',
        attachments: [] as string[]
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                title: initialData.title,
                description: initialData.description,
                requiredDate: initialData.requiredDate,
                attachments: initialData.attachments || []
            });
        } else if (isOpen) {
            setFormData({
                title: '',
                description: '',
                requiredDate: '',
                attachments: []
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const resizedImage = await resizeImage(file, 800, 0.7);
                setFormData(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, resizedImage]
                }));
            } catch (error) {
                console.error("Error processing image:", error);
            }
        }
    };

    const removeAttachment = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
                    <h2 className="text-xl font-bold text-navy-900 leading-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
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

                    {/* Attachments Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-navy-900 flex items-center gap-2">
                                <Camera className="w-4 h-4 text-emerald-600" />
                                Photos
                            </label>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1"
                            >
                                + Add Photo
                            </button>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />

                        {formData.attachments.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {formData.attachments.map((img, index) => (
                                    <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                        <img
                                            src={img}
                                            alt={`Attachment ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="p-1.5 bg-white text-rose-500 rounded-full hover:bg-rose-50 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {formData.attachments.length === 0 && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50/50 transition-colors cursor-pointer"
                            >
                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-sm">Click to add photos</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6 md:mt-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-navy-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-600/20 transition-colors"
                        >
                            {initialData ? 'Save Changes' : 'Create Requirement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
