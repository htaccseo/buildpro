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
    addProjectUpdate: (projectId: string, update: ProjectUpdate) => void;
    markNotificationRead: (id: string) => void;

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
                            }))
                    })),

                    meetings: data.meetings || [],
                    invoices: data.invoices || [],
                    notifications: data.notifications || []
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

    updateUser: (updatedUser) => {
        set((state) => ({
            currentUser: updatedUser,
            users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
        }));
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

    addProjectUpdate: (projectId, update) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? {
            ...p,
            updates: [...(p.updates || []), update]
        } : p)
    })),

    markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),

    // Invoice Actions
    addInvoice: (invoice) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;
        set((state) => ({
            invoices: [{ ...invoice, organizationId: currentOrgId } as Invoice, ...state.invoices]
        }));
    },

    updateInvoiceStatus: (id, status) => set((state) => ({
        invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
    })),

    deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter(inv => inv.id !== id)
    })),

    // Meeting Actions
    addMeeting: (meeting) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;
        set((state) => ({
            meetings: [...state.meetings, { ...meeting, organizationId: currentOrgId } as Meeting].sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
        }));
    },

    deleteMeeting: (id) => set((state) => ({
        meetings: state.meetings.filter(m => m.id !== id)
    })),

    // Reminder Actions
    addReminder: (reminder) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;
        set((state) => ({
            reminders: [...state.reminders, { ...reminder, organizationId: currentOrgId } as Reminder].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        }));
    },

    updateReminder: (updatedReminder) => set((state) => ({
        reminders: state.reminders.map(r => r.id === updatedReminder.id ? updatedReminder : r).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })),

    deleteReminder: (id) => set((state) => ({
        reminders: state.reminders.filter(r => r.id !== id)
    })),

    toggleReminder: (id) => set((state) => ({
        reminders: state.reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r)
    })),

    // Other Matters Actions
    addOtherMatter: (matter) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;
        set((state) => ({
            otherMatters: [{ ...matter, organizationId: currentOrgId } as OtherMatter, ...state.otherMatters]
        }));
    },

    deleteOtherMatter: (id) => set((state) => ({
        otherMatters: state.otherMatters.filter(om => om.id !== id)
    })),

    reset: () => set({
        projects: [],
        users: [],
        meetings: [],
        notifications: [],
        invoices: [],
        currentUser: null,
        currentOrganization: null,
        organizations: []
    }),
}));
