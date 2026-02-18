
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Camera, CheckCircle, Clock, MapPin, MessageSquare, Pencil, Plus, Trash2, UserPlus, Edit2, X, Paperclip } from 'lucide-react';
import { cn, resizeImage } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { NewProjectModal } from '../components/NewProjectModal';
import { UserAvatar } from '../components/UserAvatar';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { ProjectUpdateModal } from '../components/ProjectUpdateModal';
import type { Task, ProjectUpdate } from '../lib/types';

export function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { projects, users, currentUser, assignTask, completeTask, uncompleteTask, addTask, updateTask, addProjectUpdate, deleteProject, deleteTask, updateProjectUpdate, deleteProjectUpdate } = useStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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



    // Task Completion State
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [completionTaskId, setCompletionTaskId] = useState<string | null>(null);
    const [completionNote, setCompletionNote] = useState('');
    const [completionImage, setCompletionImage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    const openCompletionModal = (taskId: string, currentNote?: string, currentImage?: string) => {
        setCompletionTaskId(taskId);
        setCompletionNote(currentNote || '');
        setCompletionImage(currentImage || '');
        setIsCompleteModalOpen(true);
    };

    const handleCompletionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (completionTaskId) {
            completeTask(completionTaskId, completionNote, completionImage);
            setIsCompleteModalOpen(false);
            setCompletionTaskId(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Resize image to max 800px width and compress to 0.7 quality
                const resizedImage = await resizeImage(file, 800, 0.7);
                setCompletionImage(resizedImage);
            } catch (error) {
                console.error("Error resizing image:", error);
                // Fallback to original if resize fails (though unlikely)
                const reader = new FileReader();
                reader.onloadend = () => {
                    setCompletionImage(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
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
                    className="flex items-center justify-center md:justify-start gap-2 text-text-muted hover:text-navy-900 transition-colors w-10 h-10 md:w-auto md:h-auto bg-white md:bg-transparent border border-slate-200 md:border-none rounded-xl md:rounded-none shadow-sm md:shadow-none"
                    aria-label="Back to Projects"
                >
                    <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" />
                    <span className="hidden md:inline">Back to Projects</span>
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto p-0 md:px-4 md:py-2 bg-white text-navy-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium"
                        aria-label="Edit Project"
                    >
                        <Pencil className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">Edit Project</span>
                    </button>
                    <button
                        onClick={handleDeleteProject}
                        className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto p-0 md:px-4 md:py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors shadow-sm font-medium"
                        aria-label="Delete Project"
                    >
                        <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">Delete</span>
                    </button>
                </div>
            </div>

            {/* Header */}
            <div className={cn("relative min-h-[300px] md:min-h-[256px] h-auto rounded-3xl overflow-hidden group shadow-sm transition-all mt-[30px] md:mt-0 md:block flex flex-col justify-end pt-[60px] pb-6 px-6", project.color)}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />
                {/* Content Wrapper */}
                <div className="w-full relative z-10 md:absolute md:bottom-0 md:left-0 md:p-8 md:w-full">
                    <div className="flex flex-col md:flex-row justify-end md:justify-between items-end gap-3 md:gap-6">
                        <div className="w-full md:w-auto">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{project.name}</h1>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-slate-200">
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
                        <div className="flex md:hidden w-full justify-between items-end mt-4 border-t border-white/20 pt-4">
                            <div className="flex items-center gap-2 text-slate-200 text-sm">
                                <Calendar className="w-4 h-4 shrink-0" />
                                Due {format(new Date(project.endDate), 'MMM d, yyyy')}
                            </div>
                            <div className="text-white font-bold text-sm">
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
                                    className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-xl hover:bg-navy-800 transition-colors shadow-lg shadow-navy-900/20 text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
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
                                                className="p-5 flex items-start gap-4 border-none shadow-sm hover:shadow-md transition-all group cursor-pointer hover:bg-slate-50/50"
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setIsTaskDetailOpen(true);
                                                }}
                                            >
                                                <div className={cn("mt-1 p-2 rounded-lg bg-slate-50", task.status === 'completed' ? 'text-emerald-500' : 'text-amber-500')}>
                                                    {task.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className={cn("text-lg font-medium truncate pr-2", task.status === 'completed' ? "text-text-muted line-through" : "text-navy-900")}>
                                                                    {task.title}
                                                                </h3>
                                                                {task.createdBy && <UserAvatar userId={task.createdBy} className="h-5 w-5 text-[10px] shrink-0" />}
                                                            </div>
                                                            <p className="text-text-muted text-sm line-clamp-2">{task.description}</p>

                                                            {/* Attachments List */}
                                                            {task.attachments && task.attachments.length > 0 && (
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {task.attachments.map((url, idx) => {
                                                                        const filename = url.split('/').pop() || 'Attachment';
                                                                        return (
                                                                            <a
                                                                                key={idx}
                                                                                href={url}
                                                                                download
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                                                                            >
                                                                                <Paperclip className="w-3 h-3" />
                                                                                <span className="truncate max-w-[150px]">{filename}</span>
                                                                            </a>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="text-sm font-medium text-navy-900 mb-1">
                                                                {assignee ? (
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <span className="hidden sm:inline text-navy-700">{assignee.name}</span>
                                                                        <UserAvatar userId={assignee.id} className="w-8 h-8 border border-slate-100" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-end gap-2 opacity-50">
                                                                        <span className="hidden sm:inline text-text-muted">Unassigned</span>
                                                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center">
                                                                            <UserPlus className="w-4 h-4 text-slate-400" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className={cn(
                                                                "text-xs mt-1 font-medium",
                                                                task.requiredDate && new Date(task.requiredDate) < new Date() && task.status !== 'completed'
                                                                    ? "text-rose-500"
                                                                    : "text-text-muted"
                                                            )}>
                                                                Due {format(new Date(task.requiredDate), 'MMM d')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Completion Modal */}
                            {isCompleteModalOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                                        <h3 className="text-xl font-bold text-navy-900 mb-4">Complete Requirement</h3>
                                        <form onSubmit={handleCompletionSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-navy-900 mb-1.5">Completion Note</label>
                                                <textarea
                                                    value={completionNote}
                                                    onChange={(e) => setCompletionNote(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none h-24 resize-none"
                                                    placeholder="Describe the work done..."
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-navy-900 mb-1.5">Attach Photo</label>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileUpload}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                {completionImage ? (
                                                    <div className="relative group rounded-xl overflow-hidden border border-slate-200">
                                                        <img src={completionImage} alt="Completion" className="w-full h-48 object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setCompletionImage('')}
                                                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                                                        >
                                                            <div className="w-4 h-4 rotate-45">+</div>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={triggerFileInput}
                                                        className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-text-muted hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                                                    >
                                                        <Camera className="w-6 h-6" />
                                                        <span className="text-sm font-medium">Capture or Upload Photo</span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCompleteModalOpen(false)}
                                                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-navy-900 hover:bg-slate-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                                >
                                                    Complete Task
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'updates' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => openUpdateForm()}
                                    className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-xl hover:bg-navy-800 transition-colors shadow-lg shadow-navy-900/20 text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
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
                    onClose={() => {
                        setIsTaskDetailOpen(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    users={users}
                    onEdit={(task) => openTaskForm(task)}
                    onDelete={(taskId) => handleDeleteTask(taskId)}
                    onComplete={(taskId) => openCompletionModal(taskId)}
                    onUncomplete={(taskId) => uncompleteTask(taskId)}
                    onAssign={(userId) => assignTask(selectedTask.id, userId)}
                    onEditReport={(task) => openCompletionModal(task.id, task.completionNote, task.completionImage)}
                />
            )}
        </div>
    );
}

const ProjectUpdateCard = ({ update, onEdit, onDelete }: { update: ProjectUpdate, projectId?: string, onEdit: () => void, onDelete: () => void }) => {
    return (
        <Card className="p-5 border-none shadow-sm flex gap-4 bg-white">
            <div className="flex-shrink-0 mt-1">
                {(update.userId) ? (
                    <UserAvatar userId={update.userId} className="w-10 h-10 text-sm border-2 border-emerald-100" />
                ) : (
                    <UserAvatar userId="" className="w-10 h-10 text-sm border-2 border-emerald-100" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-900">{update.authorName}</span>
                        <span className="text-text-muted text-xs">• {format(new Date(update.date), 'MMM d, h:mm a')}</span>
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

                <p className="text-navy-700 leading-relaxed whitespace-pre-wrap">{update.message}</p>
            </div>
        </Card>
    );
};
