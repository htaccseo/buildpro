import { create } from 'zustand';
import type { Project, User, Meeting, Notification, Task, ProjectUpdate, Invoice, Reminder, OtherMatter, Organization } from './types';

// API Utilities
const API_URL = import.meta.env.VITE_API_URL || '/api'; // Relative for same-domain worker

async function apiRequest(endpoint: string, method: string = 'GET', data?: any) {
    const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

interface AppState {
    projects: Project[];
    users: User[];
    meetings: Meeting[];
    notifications: Notification[];
    invoices: Invoice[];

    // Organization
    organizations: Organization[]; // In a real app, this would be db table
    currentOrganization: Organization | null;
    currentUser: User | null;

    // Loading State
    isLoading: boolean;
    error: string | null;

    // Comment Actions
    addComment: (taskId: string, message: string, images?: string[]) => Promise<void>;
    deleteComment: (taskId: string, commentId: string) => Promise<void>;

    // Organization Actions
    deleteOrganization: (id: string) => void;
    updateOrganizationStatus: (id: string, status: 'active' | 'suspended') => void;

    // Actions
    login: (email: string) => Promise<void>;
    logout: () => void;
    signup: (user: Partial<User> & { organizationName: string }) => Promise<void>;
    inviteUser: (email: string, role: string) => string;
    addUser: (user: Omit<User, 'organizationId'>) => void;
    updateUser: (user: User) => void;
    addProject: (project: Omit<Project, 'organizationId'>) => Promise<void>;
    updateProject: (project: Project) => void;
    updateProjectProgress: (id: string, progress: number) => void;
    addTask: (projectId: string, task: Task) => Promise<void>;
    updateTask: (projectId: string, task: Task) => void;
    assignTask: (taskId: string, userId: string) => void;
    completeTask: (taskId: string, note?: string, images?: string[] | string) => void;
    uncompleteTask: (taskId: string) => Promise<void>;
    deleteTask: (projectId: string, taskId: string) => Promise<void>;
    addProjectUpdate: (projectId: string, update: ProjectUpdate) => void;
    updateProjectUpdate: (projectId: string, update: ProjectUpdate) => Promise<void>;
    deleteProjectUpdate: (projectId: string, updateId: string) => Promise<void>;
    markNotificationRead: (id: string) => void;

    // Project Deletion
    deleteProject: (id: string) => Promise<void>;

    // Invoice Actions
    addInvoice: (invoice: Omit<Invoice, 'organizationId'>) => void;
    updateInvoice: (invoice: Invoice) => Promise<void>;
    updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
    deleteInvoice: (id: string) => void;

    // Meeting Actions
    addMeeting: (meeting: Omit<Meeting, 'organizationId'>) => void;
    updateMeeting: (meeting: Meeting) => Promise<void>;
    deleteMeeting: (id: string) => void;

    // Reminder Actions
    reminders: Reminder[];
    addReminder: (reminder: Omit<Reminder, 'organizationId'>) => void;
    updateReminder: (reminder: Reminder) => void;
    deleteReminder: (id: string) => void;
    toggleReminder: (id: string) => void;

    // Other Matters Actions
    otherMatters: OtherMatter[];
    addOtherMatter: (matter: Omit<OtherMatter, 'organizationId'>) => void;
    updateOtherMatter: (matter: OtherMatter) => Promise<void>;
    deleteOtherMatter: (id: string) => void;

    // Debug
    reset: () => void;

    // Init
    fetchData: (email: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    projects: [],
    users: [],
    meetings: [],
    notifications: [],
    invoices: [],
    organizations: [],
    currentOrganization: null,
    currentUser: null,
    isLoading: false,
    error: null,
    reminders: [],
    otherMatters: [],

    addComment: async (taskId: string, message: string, images?: string[]) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const newComment = {
            id: Math.random().toString(36).substr(2, 9),
            taskId,
            userId: currentUser.id,
            message,
            images,
            createdAt: new Date().toISOString()
        };

        // Optimistic Update
        set((state) => ({
            projects: state.projects.map(p => ({
                ...p,
                tasks: p.tasks.map(t => t.id === taskId ? {
                    ...t,
                    comments: [...(t.comments || []), newComment]
                } : t)
            }))
        }));

        try {
            await apiRequest('/task/comment', 'POST', {
                taskId,
                userId: currentUser.id,
                message,
                images
            });
        } catch (e) {
            console.error("Failed to add comment", e);
            // Revert on failure? For now, just log.
        }
    },

    deleteComment: async (taskId, commentId) => {
        // Optimistic Update
        set((state) => ({
            projects: state.projects.map(p => ({
                ...p,
                tasks: p.tasks.map(t => t.id === taskId ? {
                    ...t,
                    comments: (t.comments || []).filter(c => c.id !== commentId)
                } : t)
            }))
        }));

        try {
            await apiRequest('/task/comment', 'DELETE', { id: commentId });
        } catch (e) {
            console.error("Failed to delete comment", e);
        }
    },

    fetchData: async (email) => {
        set({ isLoading: true, error: null });
        try {
            const data: any = await apiRequest(`/data?email=${encodeURIComponent(email)}`);
            if (data.user) {
                set({
                    currentUser: {
                        ...data.user,
                        organizationId: data.user.organization_id,
                        isAdmin: !!data.user.is_admin,
                        isSuperAdmin: !!data.user.is_super_admin
                    },
                    currentOrganization: {
                        ...data.organization,
                        createdAt: data.organization.created_at,
                        subscriptionStatus: data.organization.subscription_status
                    },
                    users: (data.users || []).map((u: any) => ({
                        ...u,
                        organizationId: u.organization_id,
                        isAdmin: !!u.is_admin,
                        isSuperAdmin: !!u.is_super_admin
                    })),

                    projects: (data.projects || []).map((p: any) => ({
                        ...p,
                        organizationId: p.organization_id,
                        clientName: p.client_name,
                        clientEmail: p.client_email,
                        clientPhone: p.client_phone,
                        startDate: p.start_date,
                        endDate: p.end_date,
                        tasks: (data.tasks || [])
                            .filter((t: any) => t.project_id === p.id)
                            .map((t: any) => ({
                                ...t,
                                projectId: t.project_id,
                                requiredDate: t.required_date,
                                assignedTo: t.assigned_to,
                                completedAt: t.completed_at,
                                completionNote: t.completion_note,
                                completionImage: t.completion_image,
                                createdBy: t.created_by,
                                completedBy: t.completed_by
                            })),
                        updates: (data.projectUpdates || [])
                            .filter((u: any) => u.project_id === p.id)
                            .map((u: any) => ({
                                ...u,
                                projectId: u.project_id,
                                authorName: u.author_name,
                                userId: u.user_id
                            }))
                    })),

                    meetings: (data.meetings || []).map((m: any) => ({
                        ...m,
                        organizationId: m.organization_id,
                        projectId: m.project_id,
                        attendees: JSON.parse(m.attendees || '[]'),
                        createdBy: m.created_by,
                        description: m.description,
                        assignedTo: m.assigned_to,
                        completed: !!m.completed,
                        completedBy: m.completed_by
                    })),

                    invoices: (data.invoices || []).map((i: any) => ({
                        ...i,
                        organizationId: i.organization_id,
                        clientName: i.client_name,
                        dueDate: i.due_date,
                        projectId: i.project_id,
                        createdBy: i.created_by,
                        attachmentUrl: i.attachment_url
                    })),

                    notifications: (data.notifications || [])
                        .filter((n: any) => n.user_id === data.user.id) // Only show my notifications
                        .map((n: any) => ({
                            ...n,
                            organizationId: n.organization_id,
                            userId: n.user_id,
                            read: !!n.read,
                            data: JSON.parse(n.data || '{}')
                        })),

                    reminders: (data.reminders || []).map((r: any) => ({
                        ...r,
                        organizationId: r.organization_id,
                        completed: !!r.completed,
                        createdBy: r.created_by,
                        assignedTo: r.assigned_to,
                        completedBy: r.completed_by
                    })),

                    otherMatters: (data.otherMatters || []).map((m: any) => ({
                        ...m,
                        organizationId: m.organization_id,
                        createdBy: m.created_by,
                        assignedTo: m.assigned_to
                    }))
                });
            }
        } catch (e: any) {
            set({ error: e.message });
        } finally {
            set({ isLoading: false });
        }
    },

    // ... (skipping some actions)

    addProject: async (project) => {
        const currentOrgId = get().currentOrganization?.id;
        const currentUserId = get().currentUser?.id;
        if (!currentOrgId || !currentUserId) return;

        const newProject = { ...project, organizationId: currentOrgId, createdBy: currentUserId } as Project;
        // Optimistic update
        set((state) => ({
            projects: [...state.projects, newProject]
        }));

        try {
            await apiRequest('/project', 'POST', newProject);
        } catch (e) {
            console.error("Failed to add project", e);
        }
    },

    // ...

    addInvoice: async (invoice) => {
        const currentOrgId = get().currentOrganization?.id;
        const currentUserId = get().currentUser?.id;
        if (!currentOrgId || !currentUserId) return;

        const newInvoice = { ...invoice, organizationId: currentOrgId, createdBy: currentUserId } as Invoice;
        set((state) => ({
            invoices: [...state.invoices, newInvoice].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        }));

        try {
            await apiRequest('/invoice', 'POST', newInvoice);
        } catch (e: any) {
            console.error("Failed to add invoice", e);
            // Rollback
            set((state) => ({
                invoices: state.invoices.filter(i => i.id !== newInvoice.id)
            }));
            alert(`Failed to save invoice: ${e.message || 'Unknown error'}`);
        }
    },

    updateInvoice: async (invoice) => {
        // Optimistic update
        set((state) => ({
            invoices: state.invoices.map(i => i.id === invoice.id ? invoice : i)
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        }));

        try {
            await apiRequest('/invoice/update', 'POST', invoice);
        } catch (e: any) {
            console.error("Failed to update invoice", e);
            // Revert to original text logic would be complex here without fetching, 
            // but at least we should alert.
            //Ideally we should re-fetch data here to sync state.
            alert(`Failed to update invoice: ${e.message || 'Unknown error'}`);
            // Force refresh to get back consistent state
            window.location.reload();
        }
    },

    // ...

    addMeeting: async (meeting) => {
        const currentOrgId = get().currentOrganization?.id;
        const currentUserId = get().currentUser?.id;
        if (!currentOrgId || !currentUserId) return;

        const newMeeting = { ...meeting, organizationId: currentOrgId, createdBy: currentUserId } as Meeting;
        // Optimistic update
        set((state) => ({
            meetings: [...state.meetings, newMeeting].sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
        }));

        try {
            await apiRequest('/meeting', 'POST', newMeeting);
        } catch (e) {
            console.error("Failed to add meeting", e);
        }
    },

    updateMeeting: async (meeting) => {
        // Optimistic update
        set((state) => ({
            meetings: state.meetings.map(m => m.id === meeting.id ? meeting : m)
                .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
        }));

        try {
            await apiRequest('/meeting/update', 'POST', meeting);
        } catch (e) {
            console.error("Failed to update meeting", e);
        }
    },

    addReminder: async (reminder) => {
        const currentOrgId = get().currentOrganization?.id;
        const currentUserId = get().currentUser?.id;
        if (!currentOrgId || !currentUserId) return;

        const newReminder = { ...reminder, organizationId: currentOrgId, createdBy: currentUserId } as Reminder;
        set((state) => ({
            reminders: [...state.reminders, newReminder].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        }));

        try {
            await apiRequest('/reminder', 'POST', newReminder);
        } catch (e) {
            console.error("Failed to add reminder", e);
        }
    },

    // ...

    addOtherMatter: async (matter) => {
        const currentOrgId = get().currentOrganization?.id;
        const currentUserId = get().currentUser?.id;
        if (!currentOrgId || !currentUserId) return;

        const newMatter = { ...matter, organizationId: currentOrgId, createdBy: currentUserId } as OtherMatter;
        set((state) => ({
            otherMatters: [newMatter, ...state.otherMatters]
        }));

        try {
            await apiRequest('/other-matter', 'POST', newMatter);
        } catch (e) {
            console.error("Failed to add other matter", e);
        }
    },

    login: async (email) => {
        // Simple login for now: just fetch data by email
        // Real app would verify password via API
        await get().fetchData(email);
    },

    signup: async ({ organizationName, organizationId, ...userDetails }) => {
        set({ isLoading: true, error: null });
        try {
            const result = await apiRequest('/signup', 'POST', {
                ...userDetails,
                company: organizationName,
                organizationId
            });
            // After signup, fetch data to log them in
            if (result.success && userDetails.email) {
                await get().fetchData(userDetails.email);
            }
        } catch (e: any) {
            set({ error: e.message });
        } finally {
            set({ isLoading: false });
        }
    },

    inviteUser: (email, role) => {
        console.log(`Inviting ${email} as ${role} to ${get().currentOrganization?.name}`);
        const orgId = get().currentOrganization?.id;

        // Call API to invite
        apiRequest('/invite', 'POST', { email, role, organizationId: orgId }).catch(e => console.error("Invite failed", e));

        return `${window.location.origin}/login?orgId=${orgId}&email=${encodeURIComponent(email)}&role=${role}`;
    },

    // TODO: Implement other API calls
    // For now these update local state, but they should also call API

    deleteOrganization: (id) => set((state) => ({
        organizations: state.organizations.filter(o => o.id !== id),
        users: state.users.filter(u => u.organizationId !== id),
        projects: state.projects.filter(p => p.organizationId !== id)
    })),

    updateOrganizationStatus: (id, status) => set((state) => ({
        organizations: state.organizations.map(o => o.id === id ? { ...o, status } : o)
    })),

    addUser: (user) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;
        set((state) => ({
            users: [...state.users, { ...user, organizationId: currentOrgId } as User]
        }));
    },

    updateUser: async (updatedUser) => {
        set((state) => ({
            currentUser: updatedUser,
            users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
        }));

        try {
            await apiRequest('/user/update', 'POST', updatedUser);
        } catch (e) {
            console.error("Failed to update user", e);
        }
    },

    logout: () => set({ currentUser: null, currentOrganization: null, projects: [], users: [] }),



    updateProject: async (updatedProject) => {
        set((state) => ({
            projects: state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p)
        }));

        try {
            await apiRequest('/project/update', 'POST', updatedProject);
        } catch (e) {
            console.error("Failed to update project", e);
        }
    },

    updateProjectProgress: (id, progress) => set((state) => ({
        projects: state.projects.map((p) => p.id === id ? { ...p, progress } : p)
    })),

    addTask: async (projectId, task) => {
        const currentOrgId = get().currentOrganization?.id;
        const currentUserId = get().currentUser?.id;
        if (!currentOrgId || !currentUserId) return;

        const newTask = { ...task, projectId, organizationId: currentOrgId, createdBy: currentUserId } as Task;
        // Optimistic update
        set((state) => ({
            projects: state.projects.map((p) => p.id === projectId ? {
                ...p,
                tasks: [newTask, ...(p.tasks || [])]
            } : p)
        }));

        try {
            await apiRequest('/task', 'POST', newTask);
        } catch (e) {
            console.error("Failed to save task", e);
        }
    },

    updateTask: async (projectId, task) => {
        set((state) => ({
            projects: state.projects.map((p) => p.id === projectId ? {
                ...p,
                tasks: (p.tasks || []).map(t => t.id === task.id ? task : t)
            } : p)
        }));

        try {
            await apiRequest('/task/update', 'POST', { ...task, projectId });
        } catch (e) {
            console.error("Failed to update task", e);
        }
    },

    assignTask: async (taskId, userId) => {
        set((state) => ({
            projects: state.projects.map((p) => ({
                ...p,
                tasks: (p.tasks || []).map((t) => t.id === taskId ? { ...t, assignedTo: userId } : t)
            }))
        }));

        // Find task and project to get details
        const project = get().projects.find(p => (p.tasks || []).some(t => t.id === taskId));
        const task = project?.tasks.find(t => t.id === taskId);

        if (task) {
            try {
                await apiRequest('/task/update', 'POST', { ...task, assignedTo: userId });
            } catch (e) {
                console.error("Failed to assign task", e);
            }
        }
    },

    completeTask: async (taskId, note, images) => {
        const project = get().projects.find(p => (p.tasks || []).some(t => t.id === taskId));
        const task = project?.tasks.find(t => t.id === taskId);
        const currentOrgId = get().currentOrganization?.id;

        if (task && project && currentOrgId) {
            const completedBy = get().currentUser?.id;
            // Optimistic Update
            set((state) => {
                // Only show notification if I am the creator (assigner) completing my own task?
                // No, usually if I complete a task, the notification goes to the assigner.
                // If I am the creator, and I complete it, I don't need a notification.
                // If SOMEONE ELSE assigned it to me, THEY should get a notification (backend handles this).
                // This optimistic update puts a notification in MY list.
                // So I should only add it here if *I* am the target of the notification.
                // But if I just completed it, I know I completed it.
                // So actually, we should probably REMOVE the optimistic notification logic entirely for the completer,
                // unless we want to confirm "Action Recorded".
                // But the requirement is "notify to member who gave a task".
                // The member who gave the task is NOT the one clicking "Complete" (usually).
                // If I am the one clicking complete, I am the assignee. The assigner is someone else.
                // So I (Assignee) should NOT seeing a notification.
                // Therefore, we should REMOVE the optimistic notification creation here, 
                // because the notification is for the *other* person.
                // However, if I assigned it to myself, maybe? But even then, I just clicked it.

                // Let's remove the optimistic notification creation to avoid confusion.
                // The backend will create it, and the Assigner will see it on next refresh/poll.
                // Or if we want real-time, we'd need websockets/polling.
                // For now, removing it from here solves the "Assignee sees notification" issue.

                return {
                    projects: state.projects.map((p) => ({
                        ...p,
                        tasks: (p.tasks || []).map((t) => t.id === taskId ? {
                            ...t,
                            status: 'completed' as const,
                            completedAt: new Date().toISOString(),
                            completionNote: note,
                            completionImages: Array.isArray(images) ? images : (images ? [images] : []),
                            completionImage: Array.isArray(images) ? images[0] : images,
                            completedBy
                        } : t)
                    })),
                    // notifications: [newNotification, ...state.notifications] // Removed
                };
            });

            try {
                await apiRequest('/task/complete', 'POST', {
                    taskId,
                    note,
                    completionImages: Array.isArray(images) ? images : (images ? [images] : []),
                    image: Array.isArray(images) ? images[0] : images,
                    completedBy
                });
            } catch (e) {
                console.error("Failed to complete task", e);
            }
        }
    },

    uncompleteTask: async (taskId: string) => {
        set((state) => ({
            projects: state.projects.map((p) => ({
                ...p,
                tasks: (p.tasks || []).map((t) => t.id === taskId ? {
                    ...t,
                    status: 'pending' as const,
                    completedAt: undefined,
                    completionNote: undefined,
                    completionImage: undefined
                } : t)
            }))
        }));

        try {
            await apiRequest('/task/uncomplete', 'POST', { taskId });
        } catch (e) {
            console.error("Failed to un-complete task", e);
        }
    },

    addProjectUpdate: async (projectId, update) => {
        set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? {
                ...p,
                updates: [update, ...(p.updates || [])]
            } : p)
        }));

        try {
            await apiRequest('/project/update-post', 'POST', { ...update, projectId, userId: update.userId });
        } catch (e) {
            console.error("Failed to post project update", e);
        }
    },

    markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),

    // Invoice Actions


    updateInvoiceStatus: (id, status) => set((state) => ({
        invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
    })),

    deleteInvoice: async (id) => {
        set((state) => ({
            invoices: state.invoices.filter(inv => inv.id !== id)
        }));
        try {
            await apiRequest('/invoice', 'DELETE', { id });
        } catch (e) {
            console.error("Failed to delete invoice", e);
        }
    },

    // Meeting Actions




    // Reminder Actions


    updateReminder: async (updatedReminder) => {
        set((state) => ({
            reminders: state.reminders.map(r => r.id === updatedReminder.id ? updatedReminder : r).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        }));
        try {
            await apiRequest('/reminder/update', 'POST', updatedReminder);
        } catch (e) {
            console.error("Failed to update reminder", e);
        }
    },

    deleteReminder: async (id) => {
        set((state) => ({
            reminders: state.reminders.filter(r => r.id !== id)
        }));

        try {
            await apiRequest('/reminder', 'DELETE', { id });
        } catch (e) {
            console.error("Failed to delete reminder", e);
        }
    },

    toggleReminder: async (id) => {
        const reminder = get().reminders.find(r => r.id === id);
        if (reminder) {
            const completedBy = !reminder.completed ? get().currentUser?.id : undefined;
            const updatedReminder = { ...reminder, completed: !reminder.completed, completedBy };
            set((state) => ({
                reminders: state.reminders.map(r => r.id === id ? updatedReminder : r)
            }));

            try {
                await apiRequest('/reminder/update', 'POST', updatedReminder);
            } catch (e) {
                console.error("Failed to toggle reminder", e);
            }
        }
    },

    // Other Matters Actions


    updateOtherMatter: async (matter) => {
        set((state) => ({
            otherMatters: state.otherMatters.map(m => m.id === matter.id ? matter : m)
        }));

        try {
            await apiRequest('/other-matter', 'PUT', {
                id: matter.id,
                title: matter.title,
                address: matter.address,
                note: matter.note,
                assignedTo: matter.assignedTo
            });
        } catch (e) {
            console.error("Failed to update other matter", e);
        }
    },

    deleteOtherMatter: async (id) => {
        set((state) => ({
            otherMatters: state.otherMatters.filter(om => om.id !== id)
        }));
        try {
            await apiRequest('/other-matter', 'DELETE', { id });
        } catch (e) {
            console.error("Failed to delete other matter", e);
        }
    },

    // Deletion Actions (Project, Task, Updates)
    deleteProject: async (id) => {
        set((state) => ({
            projects: state.projects.filter(p => p.id !== id),
        }));
        try {
            await apiRequest('/project', 'DELETE', { id });
        } catch (e) {
            console.error("Failed to delete project", e);
        }
    },

    deleteTask: async (projectId, taskId) => {
        set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? {
                ...p,
                tasks: p.tasks.filter(t => t.id !== taskId)
            } : p)
        }));
        try {
            await apiRequest('/task', 'DELETE', { id: taskId });
        } catch (e) {
            console.error("Failed to delete task", e);
        }
    },

    deleteProjectUpdate: async (projectId, updateId) => {
        set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? {
                ...p,
                updates: (p.updates || []).filter(u => u.id !== updateId)
            } : p)
        }));
        try {
            await apiRequest('/project/update', 'DELETE', { id: updateId });
        } catch (e) {
            console.error("Failed to delete project update", e);
        }
    },

    updateProjectUpdate: async (projectId, update) => {
        set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? {
                ...p,
                updates: (p.updates || []).map(u => u.id === update.id ? update : u)
            } : p)
        }));
        try {
            await apiRequest('/project/update', 'PUT', { id: update.id, message: update.message });
        } catch (e) {
            console.error("Failed to update project update", e);
        }
    },

    deleteMeeting: async (id) => {
        set((state) => ({
            meetings: state.meetings.filter(m => m.id !== id)
        }));
        try {
            await apiRequest('/meeting', 'DELETE', { id });
        } catch (e) {
            console.error("Failed to delete meeting", e);
        }
    },

    reset: () => set({
        projects: [],
        users: [],
        meetings: [],
        notifications: [],
        invoices: [],
        currentUser: null,
        currentOrganization: null,
        organizations: [],
        reminders: [],
        otherMatters: []
    }),
}));
