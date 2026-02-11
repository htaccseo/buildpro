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
    completeTask: (taskId: string, note?: string, image?: string) => void;
    deleteTask: (projectId: string, taskId: string) => Promise<void>;
    addProjectUpdate: (projectId: string, update: ProjectUpdate) => void;
    updateProjectUpdate: (projectId: string, update: ProjectUpdate) => Promise<void>;
    deleteProjectUpdate: (projectId: string, updateId: string) => Promise<void>;
    markNotificationRead: (id: string) => void;

    // Project Deletion
    deleteProject: (id: string) => Promise<void>;

    // Invoice Actions
    addInvoice: (invoice: Omit<Invoice, 'organizationId'>) => void;
    updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
    deleteInvoice: (id: string) => void;

    // Meeting Actions
    addMeeting: (meeting: Omit<Meeting, 'organizationId'>) => void;
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
    updateOtherMatter: (id: string, updates: Partial<OtherMatter>) => void;
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
                                completionImage: t.completion_image
                            })),
                        updates: (data.projectUpdates || [])
                            .filter((u: any) => u.project_id === p.id)
                            .map((u: any) => ({
                                ...u,
                                projectId: u.project_id,
                                authorName: u.author_name
                            }))
                    })),

                    meetings: (data.meetings || []).map((m: any) => ({
                        ...m,
                        organizationId: m.organization_id,
                        projectId: m.project_id,
                        attendees: JSON.parse(m.attendees || '[]')
                    })),

                    invoices: (data.invoices || []).map((i: any) => ({
                        ...i,
                        organizationId: i.organization_id,
                        clientName: i.client_name,
                        dueDate: i.due_date,
                        projectId: i.project_id
                    })),

                    notifications: (data.notifications || []).map((n: any) => ({
                        ...n,
                        organizationId: n.organization_id,
                        userId: n.user_id,
                        read: !!n.read,
                        data: JSON.parse(n.data || '{}')
                    })),

                    reminders: (data.reminders || []).map((r: any) => ({
                        ...r,
                        organizationId: r.organization_id,
                        completed: !!r.completed
                    })),

                    otherMatters: (data.otherMatters || []).map((m: any) => ({
                        ...m,
                        organizationId: m.organization_id
                    }))
                });
            }
        } catch (e: any) {
            set({ error: e.message });
        } finally {
            set({ isLoading: false });
        }
    },

    login: async (email) => {
        // Simple login for now: just fetch data by email
        // Real app would verify password via API
        await get().fetchData(email);
    },

    signup: async ({ organizationName, ...userDetails }) => {
        set({ isLoading: true, error: null });
        try {
            const result = await apiRequest('/signup', 'POST', {
                ...userDetails,
                company: organizationName
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

    addProject: async (project) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;

        const newProject = { ...project, id: crypto.randomUUID(), organizationId: currentOrgId } as Project;

        // Optimistic update
        set((state) => ({ projects: [...state.projects, newProject] }));

        try {
            await apiRequest('/project', 'POST', newProject);
        } catch (e) {
            console.error("Failed to save project", e);
            // Rollback?
        }
    },

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
        const newTask = { ...task, id: crypto.randomUUID(), projectId };

        // Optimistic
        set((state) => ({
            projects: state.projects.map((p) => p.id === projectId ? {
                ...p,
                tasks: [...(p.tasks || []), newTask]
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

    completeTask: async (taskId, note, image) => {
        const project = get().projects.find(p => (p.tasks || []).some(t => t.id === taskId));
        const task = project?.tasks.find(t => t.id === taskId);
        const currentOrgId = get().currentOrganization?.id;

        if (task && project && currentOrgId) {
            // Optimistic Update
            set((state) => {
                const newNotification: Notification = {
                    id: Math.random().toString(36).substr(2, 9),
                    organizationId: currentOrgId,
                    userId: get().currentUser?.id || 'unknown',
                    message: `Task "${task.title}" completed in ${project.name}`,
                    read: false,
                    date: new Date().toISOString(),
                    type: 'task_completed',
                    data: { taskId, note, image }
                };

                return {
                    projects: state.projects.map((p) => ({
                        ...p,
                        tasks: (p.tasks || []).map((t) => t.id === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString(), completionNote: note, completionImage: image } : t)
                    })),
                    notifications: [newNotification, ...state.notifications]
                };
            });

            try {
                await apiRequest('/task/complete', 'POST', { taskId, note, image });
            } catch (e) {
                console.error("Failed to complete task", e);
            }
        }
    },

    addProjectUpdate: async (projectId, update) => {
        set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? {
                ...p,
                updates: [...(p.updates || []), update]
            } : p)
        }));

        try {
            await apiRequest('/project/update-post', 'POST', update);
        } catch (e) {
            console.error("Failed to add project update", e);
        }
    },

    markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),

    // Invoice Actions
    addInvoice: async (invoice) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;

        const newInvoice = { ...invoice, organizationId: currentOrgId } as Invoice;
        set((state) => ({
            invoices: [newInvoice, ...state.invoices]
        }));

        try {
            await apiRequest('/invoice', 'POST', newInvoice);
        } catch (e) {
            console.error("Failed to add invoice", e);
        }
    },

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
    addMeeting: async (meeting) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;

        const newMeeting = { ...meeting, organizationId: currentOrgId } as Meeting;
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



    // Reminder Actions
    addReminder: async (reminder) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;

        const newReminder = { ...reminder, organizationId: currentOrgId } as Reminder;
        set((state) => ({
            reminders: [...state.reminders, newReminder].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        }));

        try {
            await apiRequest('/reminder', 'POST', newReminder);
        } catch (e) {
            console.error("Failed to add reminder", e);
        }
    },

    updateReminder: (updatedReminder) => set((state) => ({
        reminders: state.reminders.map(r => r.id === updatedReminder.id ? updatedReminder : r).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })),

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
        if (!reminder) return;

        const updatedCompleted = !reminder.completed;

        set((state) => ({
            reminders: state.reminders.map(r => r.id === id ? { ...r, completed: updatedCompleted } : r)
        }));

        try {
            await apiRequest('/reminder/update', 'POST', { id, completed: updatedCompleted });
        } catch (e) {
            console.error("Failed to toggle reminder", e);
        }
    },

    // Other Matters Actions
    addOtherMatter: async (matter) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;

        const newMatter = { ...matter, organizationId: currentOrgId } as OtherMatter;
        set((state) => ({
            otherMatters: [newMatter, ...state.otherMatters]
        }));

        try {
            await apiRequest('/other-matter', 'POST', newMatter);
        } catch (e) {
            console.error("Failed to add other matter", e);
        }
    },

    updateOtherMatter: async (id, updates) => {
        set((state) => ({
            otherMatters: state.otherMatters.map(om => om.id === id ? { ...om, ...updates } : om)
        }));
        try {
            await apiRequest('/other-matter', 'PUT', { id, ...updates });
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
