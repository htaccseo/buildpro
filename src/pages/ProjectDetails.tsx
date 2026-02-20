import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { format } from 'date-fns';
import { X, MessageSquare, ArrowLeft, Camera, UserPlus, MapPin, Paperclip, CheckCircle2, Circle, Trash2, Pencil, Calendar, Plus, Edit2 } from 'lucide-react';
import { cn, resizeImage } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { NewProjectModal } from '../components/NewProjectModal';
import { UserAvatar } from '../components/UserAvatar';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { ProjectUpdateModal } from '../components/ProjectUpdateModal';
import { CommentDetailModal } from '../components/CommentDetailModal';
import type { Task, ProjectUpdate } from '../lib/types';

export function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { projects, users, currentUser, assignTask, completeTask, uncompleteTask, addTask, updateTask, addProjectUpdate, deleteProject, deleteTask, updateProjectUpdate, deleteProjectUpdate, addComment, deleteComment } = useStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Comment State
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    const [replyImages, setReplyImages] = useState<{ [key: string]: string[] }>({});
    const replyFileInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});
    const [selectedComment, setSelectedComment] = useState<{ task: Task, comment: any } | null>(null);

    // Task Management State
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

    // Progress Update State
    const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
    const [updateToEdit, setUpdateToEdit] = useState<ProjectUpdate | null>(null);

    const project = projects.find(p => p.id === id);

    if (!project) {
        return <div className="text-navy-900 p-8">Project not found</div>;
    }

    const [activeTab, setActiveTab] = useState<'tasks' | 'updates'>('tasks');

    const handleTaskSubmit = (taskData: Partial<Task>) => {
        if (taskToEdit) {
            updateTask(project.id, {
                ...taskToEdit,
                ...taskData,
                title: taskData.title!,
                description: taskData.description!,
                requiredDate: taskData.requiredDate!
            });
        } else {
            addTask(project.id, {
                id: Math.random().toString(36).substr(2, 9),
                projectId: project.id,
                title: taskData.title!,
                description: taskData.description!,
                requiredDate: taskData.requiredDate!,
                attachments: taskData.attachments,
                status: 'pending'
            });
        }
        setIsTaskFormOpen(false);
        setTaskToEdit(null);
    };

    const openTaskForm = (task?: Task) => {
        if (task) {
            setTaskToEdit(task);
        } else {
            setTaskToEdit(null);
        }
        setIsTaskFormOpen(true);
    };

    const handlePostUpdate = (message: string) => {
        if (updateToEdit) {
            updateProjectUpdate(project.id, { ...updateToEdit, message });
            setUpdateToEdit(null);
        } else {
            addProjectUpdate(project.id, {
                id: Math.random().toString(36).substr(2, 9),
                projectId: project.id,
                message: message,
                date: new Date().toISOString(),
                authorName: currentUser?.name || 'Admin',
                userId: currentUser?.id
            });
        }
        setIsUpdateFormOpen(false);
    };

    const openUpdateForm = (update?: ProjectUpdate) => {
        if (update) {
            setUpdateToEdit(update);
        } else {
            setUpdateToEdit(null);
        }
        setIsUpdateFormOpen(true);
    };

    const handleDeleteProject = async () => {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            if (project) {
                const projectId = project.id;
                navigate('/projects');
                // Give navigation a moment to start before tearing down state
                setTimeout(() => deleteProject(projectId), 0);
            }
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm('Delete this work requirement?')) {
            if (project) {
                await deleteTask(project.id, taskId);
            }
        }
    };



    const [expandedImage, setExpandedImage] = useState<string | null>(null);


    const handleReplyImageUpload = async (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const resizedImage = await resizeImage(file, 800, 0.7);
                setReplyImages(prev => ({
                    ...prev,
                    [taskId]: [...(prev[taskId] || []), resizedImage]
                }));
            } catch (error) {
                console.error("Error resizing image:", error);
            }
        }
    };

    const removeReplyImage = (taskId: string, index: number) => {
        setReplyImages(prev => ({
            ...prev,
            [taskId]: (prev[taskId] || []).filter((_, i) => i !== index)
        }));
    };

    const submitComment = (taskId: string) => {
        const message = replyText[taskId];
        const images = replyImages[taskId];

        if (!message && (!images || images.length === 0)) return;

        addComment(taskId, message || '', images);

        // Reset state
        setReplyText(prev => ({ ...prev, [taskId]: '' }));
        setReplyImages(prev => ({ ...prev, [taskId]: [] }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Image Preview Modal */}
            {expandedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setExpandedImage(null)}
                >
                    <button
                        onClick={() => setExpandedImage(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="relative max-w-5xl w-full max-h-screen flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
                        <img
                            src={expandedImage}
                            alt="Full size"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <a
                            href={expandedImage}
                            download={`report-image-${new Date().getTime()}.jpg`}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-navy-900 rounded-full font-bold hover:bg-emerald-50 transition-colors shadow-lg"
                        >
                            <span className="text-xl">⬇</span> Download Image
                        </a>
                    </div>
                </div>
            )}

            {/* ... Header and other parts ... */}
            <div className="flex items-center justify-between mb-5">
                <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center justify-center md:justify-start gap-2 text-navy-700 hover:text-navy-900 transition-colors w-10 h-10 md:w-auto md:h-auto bg-white border border-slate-200 rounded-full md:rounded-full shadow-sm font-medium md:px-6 md:py-2.5"
                    aria-label="Back to Projects"
                >
                    <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" />
                    <span className="hidden md:inline">Back</span>
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto p-0 md:px-6 md:py-2.5 bg-white text-navy-700 border border-slate-200 rounded-full md:rounded-full hover:bg-slate-50 transition-colors shadow-sm font-medium"
                        aria-label="Edit Project"
                    >
                        <Pencil className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">Edit</span>
                    </button>
                    <button
                        onClick={handleDeleteProject}
                        className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto p-0 md:px-6 md:py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full md:rounded-full hover:bg-rose-100 transition-colors shadow-sm font-medium"
                        aria-label="Delete Project"
                    >
                        <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">Delete</span>
                    </button>
                </div>
            </div>

            {/* Header */}
            <div className={cn("relative min-h-[250px] md:min-h-[256px] h-auto rounded-3xl overflow-hidden group transition-all mt-[30px] md:mt-0 flex flex-col justify-end pt-12 pb-4 px-6 md:pb-6 shadow-2xl", project.color || "bg-black")}>
                {/* Content Wrapper */}
                <div className="w-full relative z-10 md:absolute md:bottom-0 md:left-0 md:p-8 md:w-full h-full flex flex-col justify-end bg-clip-border">
                    <div className="flex flex-col md:flex-row justify-end md:justify-between items-end gap-3 md:gap-6 w-full h-full">
                        <div className="w-full md:w-auto mt-auto">
                            <h1 className={cn(
                                "text-3xl md:text-4xl font-bold mb-2",
                                project.color.includes('emerald') ? "text-navy-900" :
                                    (project.color.includes('blue') || project.color.includes('navy') || project.color.includes('black')) ? "text-emerald-500" : "text-white"
                            )}>{project.name}</h1>
                            <div className={cn(
                                "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6",
                                project.color.includes('emerald') ? "text-navy-800" :
                                    (project.color.includes('blue') || project.color.includes('navy') || project.color.includes('black')) ? "text-emerald-500" : "text-slate-200"
                            )}>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    {project.address}
                                </div>
                                {/* Desktop Due Date (Hidden on Mobile) */}
                                <div className="hidden md:flex items-center gap-2">
                                    <Calendar className="w-4 h-4 shrink-0" />
                                    Due {format(new Date(project.endDate), 'MMM d, yyyy')}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Bottom Row: Due Date + Progress */}
                        <div className={cn(
                            "flex md:hidden w-full justify-between items-end mt-4 pt-4 border-t pb-2",
                            project.color.includes('emerald') ? "border-navy-900/10" : "border-white/20"
                        )}>
                            <div className={cn(
                                "flex items-center gap-2 text-sm",
                                project.color.includes('emerald') ? "text-navy-800" :
                                    (project.color.includes('blue') || project.color.includes('navy') || project.color.includes('black')) ? "text-emerald-500" : "text-slate-200"
                            )}>
                                <Calendar className="w-4 h-4 shrink-0" />
                                Due {format(new Date(project.endDate), 'MMM d, yyyy')}
                            </div>
                            <div className={cn(
                                "font-bold text-sm",
                                project.color.includes('emerald') ? "text-navy-900" : "text-white"
                            )}>
                                Progress: {project.progress}%
                            </div>
                        </div>

                        {/* Desktop Progress Section (Hidden on Mobile) */}
                        <div className="hidden md:block bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg w-full md:w-auto md:min-w-[200px] mt-2 md:mt-0 text-left">
                            {/* Desktop View: Label + Percent */}
                            <div className="hidden md:flex justify-between text-sm mb-2">
                                <span className="text-navy-900 font-medium">Progress</span>
                                <span className="text-emerald-600 font-bold">{project.progress}%</span>
                            </div>



                            {/* Progress Bar (Desktop Only) */}
                            <div className="hidden md:block h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${project.progress}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex gap-4 border-b border-slate-100 pb-4">
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={cn("px-4 py-2 rounded-lg font-medium transition-colors", activeTab === 'tasks' ? "bg-emerald-50 text-emerald-600" : "text-text-muted hover:text-navy-900 hover:bg-slate-50")}
                        >
                            Work Requirements
                        </button>
                        <button
                            onClick={() => setActiveTab('updates')}
                            className={cn("px-4 py-2 rounded-lg font-medium transition-colors", activeTab === 'updates' ? "bg-emerald-50 text-emerald-600" : "text-text-muted hover:text-navy-900 hover:bg-slate-50")}
                        >
                            Progress Notifications
                        </button>
                    </div>

                    {activeTab === 'tasks' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => openTaskForm()}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-black/20 text-sm font-bold"
                                >
                                    <Plus className="w-4 h-4 text-emerald-400" />
                                    Add Requirement
                                </button>
                            </div>

                            {project.tasks.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <p className="text-text-muted">No work requirements yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {project.tasks.map((task) => {
                                        const assignee = users.find(u => u.id === task.assignedTo);

                                        return (
                                            <Card
                                                key={task.id}
                                                className="p-3 md:p-5 flex items-start gap-3 md:gap-4 border-none shadow-sm hover:shadow-md transition-all group cursor-pointer hover:bg-slate-50/50"
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setIsTaskDetailOpen(true);
                                                }}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (task.status === 'completed') {
                                                            uncompleteTask(task.id);
                                                        } else {
                                                            completeTask(task.id);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "p-1 rounded-full transition-colors shrink-0",
                                                        task.status === 'completed' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'
                                                    )}
                                                    title={task.status === 'completed' ? "Mark as incomplete" : "Mark as complete"}
                                                >
                                                    {task.status === 'completed' ? <CheckCircle2 className="w-6 h-6" fill="currentColor" stroke="white" /> : <Circle className="w-6 h-6" strokeWidth={1.5} />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <h3 className={cn("text-lg font-medium truncate", task.status === 'completed' ? "text-text-muted line-through" : "text-navy-900")}>
                                                                        {task.title}
                                                                    </h3>

                                                                    {/* Avatars Container (Hidden on Mobile) */}
                                                                    <div className="hidden md:flex items-center space-x-[-8px]">
                                                                        {/* Creator Avatar */}
                                                                        <div className="relative z-10" title={`Created by ${users.find(u => u.id === task.createdBy)?.name || 'Unknown'}`}>
                                                                            <UserAvatar userId={task.createdBy || ''} className="w-6 h-6 border-2 border-white shadow-sm" />
                                                                        </div>
                                                                        {/* Assignee Avatar */}
                                                                        <div className="relative z-20">
                                                                            {assignee ? (
                                                                                <div title={`Assigned to ${assignee.name}`}>
                                                                                    <UserAvatar userId={assignee.id} className="w-6 h-6 border-2 border-white shadow-sm" />
                                                                                </div>
                                                                            ) : (
                                                                                <div title="Unassigned" className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                                                                                    <UserPlus className="w-3 h-3 text-slate-400" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Due Date (Right Aligned) */}
                                                                <div className="shrink-0 flex items-center">
                                                                    <p className={cn(
                                                                        "text-[11px] sm:text-xs font-medium whitespace-nowrap",
                                                                        task.requiredDate && new Date(task.requiredDate) < new Date() && task.status !== 'completed'
                                                                            ? "text-rose-500"
                                                                            : "text-text-muted"
                                                                    )}>
                                                                        Due {format(new Date(task.requiredDate), 'MMM d')}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <p className="text-text-muted text-sm line-clamp-2">{task.description}</p>

                                                            {/* Attachments List (Item 1 - Fixed to Grid) */}
                                                            {task.attachments && task.attachments.length > 0 && (
                                                                <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                                    {task.attachments.map((url, idx) => {
                                                                        const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.startsWith('data:image');
                                                                        const filename = url.split('/').pop() || 'Attachment';

                                                                        if (isImage) {
                                                                            return (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="relative group/att aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setExpandedImage(url);
                                                                                    }}
                                                                                >
                                                                                    <img src={url} alt={filename} className="w-full h-full object-cover" />
                                                                                    <div className="absolute inset-0 bg-black/0 group-hover/att:bg-black/10 transition-colors" />
                                                                                </div>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <a
                                                                                key={idx}
                                                                                href={url}
                                                                                download
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="col-span-2 flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-navy-700 hover:bg-slate-50 transition-colors"
                                                                            >
                                                                                <Paperclip className="w-4 h-4 text-slate-400" />
                                                                                <span className="truncate">{filename}</span>
                                                                            </a>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Conversational Thread & Input Wrapper */}
                                                            <div className="mt-4 pl-3 sm:pl-4 border-l-2 border-slate-200 sm:border-slate-100">
                                                                {/* Comments Section */}
                                                                {task.comments && task.comments.length > 0 && (
                                                                    <div className="space-y-2.5 sm:space-y-3 mb-3 sm:mb-4">
                                                                        {task.comments.map((comment) => (
                                                                            <div
                                                                                key={comment.id}
                                                                                className="bg-slate-50 rounded-xl p-2.5 sm:p-3 group/comment relative cursor-pointer hover:bg-slate-100 transition-colors"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedComment({ task, comment });
                                                                                }}
                                                                            >
                                                                                <div className="flex items-start gap-2 sm:gap-2.5">
                                                                                    <UserAvatar userId={comment.userId} className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                                                                                            <span className="text-sm font-bold text-navy-900 truncate pr-2">
                                                                                                {users.find(u => u.id === comment.userId)?.name || 'Unknown'}
                                                                                            </span>
                                                                                            <div className="flex items-center gap-2 shrink-0">
                                                                                                <span className="text-[10px] sm:text-xs text-text-muted">
                                                                                                    {format(new Date(comment.createdAt), 'd/M, h:mm a')}
                                                                                                </span>
                                                                                                {comment.userId === currentUser?.id && (
                                                                                                    <button
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            if (confirm('Delete this comment?')) {
                                                                                                                deleteComment(task.id, comment.id);
                                                                                                            }
                                                                                                        }}
                                                                                                        className="p-1 -mr-1 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-100 sm:opacity-0 group-hover/comment:opacity-100"
                                                                                                    >
                                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        <p className="text-[13px] sm:text-sm text-navy-700 whitespace-pre-wrap">{comment.message}</p>
                                                                                        {comment.images && comment.images.length > 0 && (
                                                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                                                {comment.images.map((img, i) => (
                                                                                                    <div
                                                                                                        key={i}
                                                                                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            setExpandedImage(img);
                                                                                                        }}
                                                                                                    >
                                                                                                        <img src={img} alt="Comment attachment" className="w-full h-full object-cover" />
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Reply Input */}
                                                                <div className="flex gap-2 items-end w-full" onClick={(e) => e.stopPropagation()}>
                                                                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-navy-900 focus-within:ring-1 focus-within:ring-navy-900 transition-all">
                                                                        <textarea
                                                                            value={replyText[task.id] || ''}
                                                                            onChange={(e) => setReplyText(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                                            placeholder="Write a reply..."
                                                                            className="w-full bg-transparent border-none outline-none focus:ring-0 px-3 py-2 text-[13px] sm:text-sm min-h-[40px] resize-none"
                                                                            rows={1}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                                    e.preventDefault();
                                                                                    submitComment(task.id);
                                                                                }
                                                                            }}
                                                                        />
                                                                        {/* Attached Images Preview */}
                                                                        {replyImages[task.id] && replyImages[task.id].length > 0 && (
                                                                            <div className="px-3 pb-2 flex flex-wrap gap-2">
                                                                                {replyImages[task.id].map((img, idx) => (
                                                                                    <div key={idx} className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-slate-200">
                                                                                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                                                                        <button
                                                                                            onClick={() => removeReplyImage(task.id, idx)}
                                                                                            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white"
                                                                                        >
                                                                                            <X className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-1 pb-1 shrink-0">
                                                                        <input
                                                                            type="file"
                                                                            ref={el => { if (el) replyFileInputRefs.current[task.id] = el }}
                                                                            className="hidden"
                                                                            accept="image/*"
                                                                            onChange={(e) => handleReplyImageUpload(task.id, e)}
                                                                        />
                                                                        <button
                                                                            onClick={() => replyFileInputRefs.current[task.id]?.click()}
                                                                            className="p-2 sm:p-2.5 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-full transition-colors"
                                                                            title="Attach Image"
                                                                        >
                                                                            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => submitComment(task.id)}
                                                                            disabled={!replyText[task.id] && (!replyImages[task.id] || replyImages[task.id].length === 0)}
                                                                            className="p-2 sm:p-2.5 bg-black text-white rounded-full hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                                                                        >
                                                                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 rotate-90" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'updates' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => openUpdateForm()}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-black/20 text-sm font-bold"
                                >
                                    <Plus className="w-4 h-4 text-emerald-400" />
                                    Add Notification
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(project.updates || []).length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                                        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-text-muted">No updates yet.</p>
                                    </div>
                                ) : (
                                    (project.updates || []).slice().reverse().map((update) => (
                                        <ProjectUpdateCard
                                            key={update.id}
                                            update={update}
                                            projectId={project.id}
                                            onEdit={() => openUpdateForm(update)}
                                            onDelete={() => {
                                                if (confirm('Are you sure you want to delete this update?')) {
                                                    deleteProjectUpdate(project.id, update.id);
                                                }
                                            }}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>




                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="p-6 border-none shadow-sm">
                        <h3 className="text-lg font-bold text-navy-900 mb-4">Client Details</h3>
                        <div className="space-y-3">
                            <div>
                                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Client Name</span>
                                <p className="text-navy-900 font-medium">{project.clientName}</p>
                            </div>
                            <div>
                                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Contact</span>
                                <div className="mt-1 space-y-1">
                                    {project.clientEmail && (
                                        <a href={`mailto:${project.clientEmail} `} className="block text-emerald-600 hover:underline font-medium break-all">
                                            {project.clientEmail}
                                        </a>
                                    )}
                                    {project.clientPhone && (
                                        <a href={`tel:${project.clientPhone} `} className="block text-navy-700 hover:text-navy-900 font-medium">
                                            {project.clientPhone}
                                        </a>
                                    )}
                                    {!project.clientEmail && !project.clientPhone && (
                                        <span className="text-sm text-text-muted italic">No contact details available</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <NewProjectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                projectToEdit={project}
            />

            <TaskFormModal
                isOpen={isTaskFormOpen}
                onClose={() => setIsTaskFormOpen(false)}
                onSubmit={handleTaskSubmit}
                initialData={taskToEdit}
                title={taskToEdit ? 'Edit Requirement' : 'New requirement'}
            />

            <ProjectUpdateModal
                isOpen={isUpdateFormOpen}
                onClose={() => setIsUpdateFormOpen(false)}
                onSubmit={handlePostUpdate}
                initialData={updateToEdit}
                title={updateToEdit ? 'Edit Notification' : 'New Notification'}
            />

            {selectedTask && (
                <TaskDetailModal
                    isOpen={isTaskDetailOpen}
                    onClose={() => setIsTaskDetailOpen(false)}
                    task={selectedTask!}
                    users={users}
                    onEdit={(task) => {
                        setIsTaskDetailOpen(false);
                        openTaskForm(task);
                    }}
                    onDelete={(taskId) => handleDeleteTask(taskId)}
                    onComplete={(taskId) => {
                        completeTask(taskId);
                        setIsTaskDetailOpen(false);
                    }}
                    onUncomplete={(taskId) => uncompleteTask(taskId)}
                    onAssign={(userId) => {
                        if (selectedTask) {
                            assignTask(selectedTask.id, userId);
                        }
                    }}
                />)}

            <CommentDetailModal
                isOpen={!!selectedComment}
                onClose={() => setSelectedComment(null)}
                comment={selectedComment?.comment}
                user={users.find(u => u.id === selectedComment?.comment.userId)}
                onDelete={() => {
                    if (selectedComment) {
                        deleteComment(selectedComment.task.id, selectedComment.comment.id);
                        setSelectedComment(null);
                    }
                }}
                canDelete={selectedComment ? !!(currentUser?.id === selectedComment.comment.userId || currentUser?.isAdmin) : false}
            />
        </div>
    );
}

const ProjectUpdateCard = ({ update, onEdit, onDelete }: { update: ProjectUpdate, projectId?: string, onEdit: () => void, onDelete: () => void }) => {
    return (
        <Card className="p-4 border-none shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <div className="mr-2.5">
                        <UserAvatar userId={update.userId} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-navy-900 leading-tight">{update.authorName}</span>
                        <span className="text-text-muted text-xs">• {format(new Date(update.date), 'MMM d, h:mm a')}</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={onEdit}
                        className="p-1.5 text-slate-300 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50"
                        title="Edit Update"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                        title="Delete Update"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <p className="text-navy-700 leading-relaxed whitespace-pre-wrap pl-11">{update.message}</p>
        </Card>
    );
};
