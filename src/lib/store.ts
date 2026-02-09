import { create } from 'zustand';
import type { Project, User, Meeting, Notification, Task, ProjectUpdate, Invoice, Reminder, OtherMatter, Organization } from './types';
import { MOCK_PROJECTS, MOCK_USERS, MOCK_MEETINGS, MOCK_NOTIFICATIONS, MOCK_ORGANIZATION } from './mockData';

const MOCK_INVOICES: Invoice[] = [
    { id: 'inv1', organizationId: MOCK_ORGANIZATION.id, type: 'sent', amount: 15000, clientName: 'Mr. Smith', dueDate: '2024-04-15', status: 'pending', date: '2024-04-01', description: 'Initial Deposit - Villa Renovation', projectId: 'p1' },
    { id: 'inv2', organizationId: MOCK_ORGANIZATION.id, type: 'received', amount: 2400, clientName: 'Sparky Electric', dueDate: '2024-03-28', status: 'overdue', date: '2024-03-14', description: 'Wiring Materials' },
    { id: 'inv3', organizationId: MOCK_ORGANIZATION.id, type: 'sent', amount: 8500, clientName: 'Urban Corp', dueDate: '2024-03-20', status: 'paid', date: '2024-02-20', description: 'Foundation Stage', projectId: 'p2' },
];

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

    // Organization Actions
    deleteOrganization: (id: string) => void;
    updateOrganizationStatus: (id: string, status: 'active' | 'suspended') => void;

    // Actions
    login: (email: string) => void;
    logout: () => void;
    signup: (user: Partial<User> & { organizationName: string }) => void;
    inviteUser: (email: string, role: string) => string;
    addUser: (user: Omit<User, 'organizationId'>) => void;
    updateUser: (user: User) => void;
    addProject: (project: Omit<Project, 'organizationId'>) => void;
    updateProject: (project: Project) => void;
    updateProjectProgress: (id: string, progress: number) => void;
    addTask: (projectId: string, task: Task) => void;
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
}

export const useStore = create<AppState>((set, get) => ({
    projects: MOCK_PROJECTS,
    users: MOCK_USERS,
    meetings: MOCK_MEETINGS,
    notifications: MOCK_NOTIFICATIONS,
    invoices: MOCK_INVOICES,

    organizations: [MOCK_ORGANIZATION],
    currentOrganization: null,
    currentUser: null,

    login: (email) => {
        const user = get().users.find(u => u.email === email);
        if (user) {
            const org = get().organizations.find(o => o.id === user.organizationId);
            set({ currentUser: user, currentOrganization: org || null });
        } else {
            // Fallback for demo if not found in list (shouldn't happen with correct usage)
            const defaultUser = { ...MOCK_USERS[0], isAdmin: true };
            const defaultOrg = MOCK_ORGANIZATION;
            set({ currentUser: defaultUser, currentOrganization: defaultOrg });
        }
    },

    inviteUser: (email, role) => {
        // In a real app, this would send an email. 
        // For demo, we just log it or we could create a pending user state.
        console.log(`Inviting ${email} as ${role} to ${get().currentOrganization?.name}`);
        // We could return the link here if we want to show it in UI
        return `${window.location.origin}/login?orgId=${get().currentOrganization?.id}&email=${encodeURIComponent(email)}&role=${role}`;
    },

    signup: ({ organizationName, ...userDetails }) => {
        let orgId = '';
        let newOrg: Organization | undefined;

        const existingOrg = get().organizations.find(o => o.id === organizationName); // simplistic check

        if (existingOrg) {
            orgId = existingOrg.id;
            // Don't create new org
        } else {
            newOrg = {
                id: Math.random().toString(36).substr(2, 9),
                name: organizationName,
                createdAt: new Date().toISOString(),
                status: 'active',
                subscriptionStatus: 'trial'
            };
            orgId = newOrg.id;
        }

        const newUser: User = {
            ...userDetails as User,
            id: Math.random().toString(36).substr(2, 9),
            organizationId: orgId,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userDetails.name || 'User')}&background=random`,
            isAdmin: !existingOrg // First user of new org is admin
        };

        set((state) => ({
            organizations: newOrg ? [...state.organizations, newOrg] : state.organizations,
            users: [...state.users, newUser],
            currentUser: newUser,
            currentOrganization: existingOrg || newOrg!
        }));
    },

    deleteOrganization: (id) => set((state) => ({
        organizations: state.organizations.filter(o => o.id !== id),
        // Cascade delete users and data related to this org if needed, but for now simple removal
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

    logout: () => set({ currentUser: null, currentOrganization: null }),

    addProject: (project) => {
        const currentOrgId = get().currentOrganization?.id;
        if (!currentOrgId) return;
        set((state) => ({ projects: [...state.projects, { ...project, organizationId: currentOrgId } as Project] }));
    },

    updateProject: (updatedProject) => set((state) => ({
        projects: state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p)
    })),

    updateProjectProgress: (id, progress) => set((state) => ({
        projects: state.projects.map((p) => p.id === id ? { ...p, progress } : p)
    })),

    addTask: (projectId, task) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? {
            ...p,
            tasks: [...p.tasks, task]
        } : p)
    })),

    updateTask: (projectId, task) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? {
            ...p,
            tasks: p.tasks.map(t => t.id === task.id ? task : t)
        } : p)
    })),

    assignTask: (taskId, userId) => set((state) => ({
        projects: state.projects.map((p) => ({
            ...p,
            tasks: p.tasks.map((t) => t.id === taskId ? { ...t, assignedTo: userId } : t)
        }))
    })),

    completeTask: (taskId, note, image) => set((state) => {
        const project = state.projects.find(p => p.tasks.some(t => t.id === taskId));
        const task = project?.tasks.find(t => t.id === taskId);
        const currentOrgId = get().currentOrganization?.id;

        if (task && project && currentOrgId) {
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
                    tasks: p.tasks.map((t) => t.id === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString(), completionNote: note, completionImage: image } : t)
                })),
                notifications: [newNotification, ...state.notifications]
            };
        }
        return state;
    }),

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
    reminders: [],

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
    otherMatters: [],

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
        projects: MOCK_PROJECTS,
        users: MOCK_USERS,
        meetings: MOCK_MEETINGS,
        notifications: MOCK_NOTIFICATIONS,
        invoices: MOCK_INVOICES,
        currentUser: MOCK_USERS[0],
        currentOrganization: MOCK_ORGANIZATION,
        organizations: [MOCK_ORGANIZATION]
    }),
}));
