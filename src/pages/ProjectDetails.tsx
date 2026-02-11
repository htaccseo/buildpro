
import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, Calendar, Camera, CheckCircle, Clock, FileText, MapPin, MessageSquare, MoreVertical, Pencil, Plus, Send, Trash2, Upload, UserPlus, X } from 'lucide-react';
import { cn, resizeImage } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { NewProjectModal } from '../components/NewProjectModal';
import type { Task } from '../lib/types';

export function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { projects, users, currentUser, assignTask, completeTask, addTask, updateTask, addProjectUpdate, deleteProject, deleteTask, deleteProjectUpdate } = useStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Task Management State
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskDate, setTaskDate] = useState('');

    // Progress Update State
    const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    const project = projects.find(p => p.id === id);

    if (!project) {
        return <div className="text-navy-900 p-8">Project not found</div>;
    }

    const [activeTab, setActiveTab] = useState<'tasks' | 'updates'>('tasks');

    const handleTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (taskToEdit) {
            updateTask(project.id, {
                ...taskToEdit,
                title: taskTitle,
                description: taskDesc,
                requiredDate: taskDate
            });
        } else {
            addTask(project.id, {
                id: Math.random().toString(36).substr(2, 9),
                projectId: project.id,
                title: taskTitle,
                description: taskDesc,
                requiredDate: taskDate,
                status: 'pending'
            });
        }
        closeTaskForm();
    };

    const openTaskForm = (task?: Task) => {
        if (task) {
            setTaskToEdit(task);
            setTaskTitle(task.title);
            setTaskDesc(task.description);
            setTaskDate(task.requiredDate);
        } else {
            setTaskToEdit(null);
            setTaskTitle('');
            setTaskDesc('');
            setTaskDate('');
        }
        setIsTaskFormOpen(true);
    };

    const closeTaskForm = () => {
        setIsTaskFormOpen(false);
        setTaskToEdit(null);
    };

    const handlePostUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!updateMessage.trim()) return;

        addProjectUpdate(project.id, {
            id: Math.random().toString(36).substr(2, 9),
            message: updateMessage,
            date: new Date().toISOString(),
            authorName: currentUser?.name || 'Admin'
        });
        setUpdateMessage('');
        setIsUpdateFormOpen(false);
    };

    const handleDeleteProject = async () => {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            if (project) {
                await deleteProject(project.id);
                navigate('/projects');
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

    const handleDeleteUpdate = async (updateId: string) => {
        if (confirm('Delete this progress notification?')) {
            if (project) {
                await deleteProjectUpdate(project.id, updateId);
            }
        }
    };

    // Task Completion State
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [completionTaskId, setCompletionTaskId] = useState<string | null>(null);
    const [completionNote, setCompletionNote] = useState('');
    const [completionImage, setCompletionImage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const openCompletionModal = (taskId: string) => {
        setCompletionTaskId(taskId);
        setCompletionNote('');
        setCompletionImage('');
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
            {/* ... Header and other parts ... */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-text-muted hover:text-navy-900 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Projects
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-navy-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit Project
                    </button>
                    <button
                        onClick={handleDeleteProject}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors shadow-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Header */}
            <div className={cn("relative h-64 rounded-3xl overflow-hidden group shadow-sm transition-all", project.color)}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{project.name}</h1>
                            <div className="flex items-center gap-6 text-slate-200">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {project.address}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Due {format(new Date(project.endDate), 'MMM d, yyyy')}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg min-w-[200px]">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-navy-900 font-medium">Progress</span>
                                <span className="text-emerald-600 font-bold">{project.progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${project.progress}% ` }} />
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

                            {/* Task Form */}
                            {isTaskFormOpen && (
                                <Card className="p-6 border-none shadow-md ring-1 ring-slate-100 animate-in slide-in-from-top-4 duration-200">
                                    <h3 className="text-lg font-bold text-navy-900 mb-4">{taskToEdit ? 'Edit Requirement' : 'New Requirement'}</h3>
                                    <form onSubmit={handleTaskSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-navy-900 mb-1.5">Title</label>
                                            <input
                                                type="text"
                                                value={taskTitle}
                                                onChange={(e) => setTaskTitle(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                                                placeholder="e.g. Install Windows"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-navy-900 mb-1.5">Description</label>
                                            <textarea
                                                value={taskDesc}
                                                onChange={(e) => setTaskDesc(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none h-24 resize-none"
                                                placeholder="Details about the task..."
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-navy-900 mb-1.5">Due Date</label>
                                            <input
                                                type="date"
                                                value={taskDate}
                                                onChange={(e) => setTaskDate(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={closeTaskForm}
                                                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-navy-900 hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                            >
                                                {taskToEdit ? 'Save Changes' : 'Add Task'}
                                            </button>
                                        </div>
                                    </form>
                                </Card>
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

                            {project.tasks.length === 0 && !isTaskFormOpen && (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <p className="text-text-muted">No work requirements yet.</p>
                                </div>
                            )}

                            {project.tasks.map(task => {
                                const assignee = users.find(u => u.id === task.assignedTo);
                                return (
                                    <Card key={task.id} className="p-5 flex items-start gap-4 border-none shadow-sm hover:shadow-md transition-shadow group">
                                        <div className={cn("mt-1 p-2 rounded-lg bg-slate-50", task.status === 'completed' ? 'text-emerald-500' : 'text-amber-500')}>
                                            {task.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className={cn("text-lg font-medium", task.status === 'completed' ? "text-text-muted line-through" : "text-navy-900")}>
                                                            {task.title}
                                                        </h3>
                                                        <button
                                                            onClick={() => openTaskForm(task)}
                                                            className="text-slate-400 hover:text-navy-900 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <p className="text-text-muted text-sm mt-1">{task.description}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-navy-900">
                                                        {assignee ? (
                                                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                                                <img src={assignee.avatar} className="w-5 h-5 rounded-full" />
                                                                <span>{assignee.name}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-text-muted bg-slate-50 px-3 py-1 rounded-full border border-dashed border-slate-200">
                                                                <UserPlus className="w-4 h-4" />
                                                                <span>Unassigned</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-muted mt-2">Due {format(new Date(task.requiredDate), 'MMM d')}</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {task.status !== 'completed' && (
                                                <div className="mt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="relative group/assign">
                                                        <select
                                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                            onChange={(e) => assignTask(task.id, e.target.value)}
                                                            value={task.assignedTo || ''}
                                                        >
                                                            <option value="">Assign to...</option>
                                                            {users.filter(u => u.role !== 'builder').map(u => (
                                                                <option key={u.id} value={u.id}>{u.name}</option>
                                                            ))}
                                                        </select>
                                                        <button className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-navy-900 rounded-lg flex items-center gap-2 shadow-sm">
                                                            <UserPlus className="w-3 h-3" />
                                                            {task.assignedTo ? 'Reassign' : 'Assign Worker'}
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => openCompletionModal(task.id)}
                                                        className="px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg flex items-center gap-2"
                                                    >
                                                        <CheckCircle className="w-3 h-3" />
                                                        Mark Complete
                                                    </button>
                                                </div>
                                            )}

                                            {task.status === 'completed' && task.completionNote && (
                                                <div className="mt-4 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                                                    <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-1">
                                                        <FileText className="w-4 h-4" />
                                                        Completion Report
                                                    </div>
                                                    <p className="text-sm text-navy-700">{task.completionNote}</p>
                                                    {task.completionImage && (
                                                        <div className="mt-2 relative group/img w-fit">
                                                            <img src={task.completionImage} alt="Proof" className="w-24 h-16 object-cover rounded-lg border border-slate-200" />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg">
                                                                <Camera className="w-4 h-4 text-white" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'updates' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsUpdateFormOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-xl hover:bg-navy-800 transition-colors shadow-lg shadow-navy-900/20 text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Notification
                                </button>
                            </div>

                            {isUpdateFormOpen && (
                                <Card className="p-6 border-none shadow-md ring-1 ring-slate-100 animate-in slide-in-from-top-4 duration-200">
                                    <h3 className="text-lg font-bold text-navy-900 mb-4">Post Update</h3>
                                    <form onSubmit={handlePostUpdate} className="space-y-4">
                                        <div>
                                            <textarea
                                                value={updateMessage}
                                                onChange={(e) => setUpdateMessage(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none h-32 resize-none"
                                                placeholder="e.g. Building Surveyor has been engaged..."
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsUpdateFormOpen(false)}
                                                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-navy-900 hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!updateMessage.trim()}
                                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                            >
                                                <Send className="w-4 h-4" />
                                                Post
                                            </button>
                                        </div>
                                    </form>
                                </Card>
                            )}

                            <div className="space-y-4">
                                {(project.updates || []).length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                                        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-text-muted">No updates yet.</p>
                                    </div>
                                ) : (
                                    (project.updates || []).slice().reverse().map((update) => (
                                        <Card key={update.id} className="p-5 border-none shadow-sm flex gap-4">
                                            <div className="mt-1 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-emerald-700 font-bold">{update.authorName.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-navy-900">{update.authorName}</span>
                                                        <span className="text-text-muted text-xs">• {format(new Date(update.date), 'MMM d, h:mm a')}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteUpdate(update.id)}
                                                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-navy-700 leading-relaxed">{update.message}</p>
                                            </div>
                                        </Card>
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
        </div>
    );
}
