import React from 'react';
import type { Task, User } from '../lib/types';
import { format } from 'date-fns';
import { X, Calendar, CheckCircle, Clock, Paperclip, Pencil, Trash2, Download, FileText, Camera, RotateCcw, ChevronDown } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { cn } from '../lib/utils';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    users: User[];
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    onComplete: (taskId: string) => void;
    onUncomplete: (taskId: string) => void;
    onAssign: (userId: string) => void;
    onEditReport: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    isOpen,
    onClose,
    task,
    users,
    onEdit,
    onDelete,
    onComplete,
    onUncomplete,
    onAssign,
    onEditReport
}) => {
    if (!isOpen) return null;

    const assignee = users.find(u => u.id === task.assignedTo);
    const creator = users.find(u => u.id === task.createdBy);
    const completer = users.find(u => u.id === task.completedBy);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-100">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                                task.status === 'completed'
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : "bg-amber-50 text-amber-600 border border-amber-100"
                            )}>
                                {task.status === 'completed' ? (
                                    <>
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Completed
                                    </>
                                ) : (
                                    <>
                                        <Clock className="w-3.5 h-3.5" />
                                        Pending
                                    </>
                                )}
                            </span>
                            {task.requiredDate && (
                                <span className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5",
                                    new Date(task.requiredDate) < new Date() && task.status !== 'completed'
                                        ? "bg-rose-50 text-rose-600 border-rose-100"
                                        : "bg-slate-50 text-text-muted border-slate-100"
                                )}>
                                    <Calendar className="w-3.5 h-3.5" />
                                    Due {format(new Date(task.requiredDate), 'MMM d, yyyy')}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-navy-900 leading-tight">{task.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Description */}
                    {task.description && (
                        <div className="prose prose-sm prose-slate max-w-none">
                            <p className="text-slate-600 whitespace-pre-wrap">{task.description}</p>
                        </div>
                    )}

                    {/* Completion Report */}
                    {task.status === 'completed' && (task.completionNote || task.completionImage) && (
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold">
                                <FileText className="w-4 h-4" />
                                Completion Report
                                {completer && <span className="text-emerald-600 font-medium ml-auto text-xs flex items-center gap-1">by <UserAvatar userId={completer.id} className="w-4 h-4" /> {completer.name}</span>}
                                <button
                                    onClick={() => {
                                        onEditReport(task);
                                        onClose();
                                    }}
                                    className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded ml-2 transition-colors"
                                    title="Edit Report"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {task.completionNote && (
                                <p className="text-sm text-navy-700">{task.completionNote}</p>
                            )}

                            {task.completionImage && (
                                <div className="relative group w-fit">
                                    <img
                                        src={task.completionImage}
                                        alt="Proof"
                                        className="w-full max-w-[200px] h-auto rounded-lg border border-emerald-100 shadow-sm"
                                        onClick={() => window.open(task.completionImage, '_blank')}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 md:group-hover:bg-black/10 transition-colors rounded-lg cursor-pointer">
                                        <Camera className="w-6 h-6 text-white opacity-0 md:group-hover:opacity-100 drop-shadow-md" />
                                        <a
                                            href={task.completionImage}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute bottom-2 right-2 p-1.5 bg-white/90 text-slate-700 rounded-full shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white hover:text-emerald-600"
                                            title="Download Image"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">Assigned To</span>
                            <div className="flex items-center gap-2 overflow-hidden relative pr-6">
                                {assignee ? (
                                    <>
                                        <UserAvatar userId={assignee.id} className="w-8 h-8 shrink-0" />
                                        <span className="text-sm font-medium text-navy-900 truncate">{assignee.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                            <UserAvatar userId="" className="w-8 h-8" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-500 italic">Unassigned</span>
                                    </>
                                )}
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <select
                                    value={task.assignedTo || ''}
                                    onChange={(e) => onAssign(e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                >
                                    <option value="">Unassigned</option>
                                    {users.filter(u => u.role !== 'builder').map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">Created By</span>
                            <div className="flex items-center gap-2 overflow-hidden">
                                {creator ? (
                                    <>
                                        <UserAvatar userId={creator.id} className="w-8 h-8 shrink-0" />
                                        <span className="text-sm font-medium text-navy-900 truncate">{creator.name}</span>
                                    </>
                                ) : (
                                    <span className="text-sm font-medium text-slate-500 italic">Unknown</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    {(task.attachments && task.attachments.length > 0) && (
                        <div>
                            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-emerald-600" />
                                Attachments
                            </h3>
                            <div className="space-y-2">
                                {task.attachments.map((url, index) => {
                                    const filename = url.split('/').pop() || `Attachment ${index + 1}`;
                                    return (
                                        <a
                                            key={index}
                                            href={url}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Paperclip className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-navy-900 truncate group-hover:text-emerald-700">
                                                    {filename}
                                                </span>
                                            </div>
                                            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                    {task.status !== 'completed' ? (
                        <button
                            onClick={() => {
                                onComplete(task.id);
                                onClose();
                            }}
                            className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-colors mb-1"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Mark as Complete
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to reopen this task? This will remove the completion report.')) {
                                    onUncomplete(task.id);
                                    onClose();
                                }
                            }}
                            className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-600 hover:text-navy-900 rounded-xl hover:bg-slate-50 font-medium flex items-center justify-center gap-2 transition-colors mb-1"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reopen Task
                        </button>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                onEdit(task);
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-navy-900 rounded-xl hover:bg-slate-50 font-medium shadow-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit details
                        </button>
                        <button
                            onClick={() => {
                                onDelete(task.id);
                                onClose();
                            }}
                            className="px-4 py-3 bg-white border border-rose-100 text-rose-600 rounded-xl hover:bg-rose-50 font-medium shadow-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
