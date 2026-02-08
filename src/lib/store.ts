import { create } from 'zustand';
import type { Project, User, Meeting, Notification, Task, ProjectUpdate, Invoice, Reminder, OtherMatter } from './types';
import { MOCK_PROJECTS, MOCK_USERS, MOCK_MEETINGS, MOCK_NOTIFICATIONS } from './mockData';

const MOCK_INVOICES: Invoice[] = [
    { id: 'inv1', type: 'sent', amount: 15000, clientName: 'Mr. Smith', dueDate: '2024-04-15', status: 'pending', date: '2024-04-01', description: 'Initial Deposit - Villa Renovation', projectId: 'p1' },
    { id: 'inv2', type: 'received', amount: 2400, clientName: 'Sparky Electric', dueDate: '2024-03-28', status: 'overdue', date: '2024-03-14', description: 'Wiring Materials' },
    { id: 'inv3', type: 'sent', amount: 8500, clientName: 'Urban Corp', dueDate: '2024-03-20', status: 'paid', date: '2024-02-20', description: 'Foundation Stage', projectId: 'p2' },
];

interface AppState {
    projects: Project[];
    users: User[];
    meetings: Meeting[];
    notifications: Notification[];
    invoices: Invoice[];
    currentUser: User | null;

    // Actions
    login: (email: string) => void;
    logout: () => void;
    signup: (user: User) => void;
    addUser: (user: User) => void;
    updateUser: (user: User) => void;
    addProject: (project: Project) => void;
    updateProject: (project: Project) => void;
    updateProjectProgress: (id: string, progress: number) => void;
    addTask: (projectId: string, task: Task) => void;
    updateTask: (projectId: string, task: Task) => void;
    assignTask: (taskId: string, userId: string) => void;
    completeTask: (taskId: string, note?: string, image?: string) => void;
    addProjectUpdate: (projectId: string, update: ProjectUpdate) => void;
    markNotificationRead: (id: string) => void;

    // Invoice Actions
    addInvoice: (invoice: Invoice) => void;
    updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
    deleteInvoice: (id: string) => void;

    // Meeting Actions
    addMeeting: (meeting: Meeting) => void;
    deleteMeeting: (id: string) => void;

    // Reminder Actions
    reminders: Reminder[];
    addReminder: (reminder: Reminder) => void;
    updateReminder: (reminder: Reminder) => void;
    deleteReminder: (id: string) => void;
    toggleReminder: (id: string) => void;

    // Other Matters Actions
    otherMatters: OtherMatter[];
    addOtherMatter: (matter: OtherMatter) => void;
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
    currentUser: null,

    login: (email) => {
        const user = MOCK_USERS.find(u => u.email === email) || MOCK_USERS[0];
        set({ currentUser: user });
    },

    signup: (user) => {
        // In a real app, this would make an API call.
        // For now, we update the local state.
        set((state) => ({
            users: [...state.users, user],
            currentUser: user
        }));
    },

    addUser: (user: User) => {
        set((state) => ({
            users: [...state.users, user]
        }));
    },

    updateUser: (updatedUser) => {
        set((state) => ({
            currentUser: updatedUser,
            users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
        }));
    },

    logout: () => set({ currentUser: null }),

    addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),

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
        // Find the task and project to create a notification
        const project = state.projects.find(p => p.tasks.some(t => t.id === taskId));
        const task = project?.tasks.find(t => t.id === taskId);

        // Create detailed notification
        if (task && project) {
            const newNotification: Notification = {
                id: Math.random().toString(36).substr(2, 9),
                userId: get().currentUser?.id || 'unknown', // Notification for the builder
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

    addProjectUpdate: (projectId: string, update: ProjectUpdate) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? {
            ...p,
            updates: [...(p.updates || []), update]
        } : p)
    })),

    markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),

    // Invoice Actions
    addInvoice: (invoice) => set((state) => ({
        invoices: [invoice, ...state.invoices]
    })),

    updateInvoiceStatus: (id, status) => set((state) => ({
        invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
    })),

    deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter(inv => inv.id !== id)
    })),

    // Meeting Actions
    addMeeting: (meeting) => set((state) => ({
        meetings: [...state.meetings, meeting].sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
    })),

    deleteMeeting: (id) => set((state) => ({
        meetings: state.meetings.filter(m => m.id !== id)
    })),

    // Reminder Actions
    reminders: [], // Initial empty state

    addReminder: (reminder) => set((state) => ({
        reminders: [...state.reminders, reminder].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })),

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

    addOtherMatter: (matter) => set((state) => ({
        otherMatters: [matter, ...state.otherMatters]
    })),

    deleteOtherMatter: (id) => set((state) => ({
        otherMatters: state.otherMatters.filter(om => om.id !== id)
    })),

    reset: () => set({
        projects: MOCK_PROJECTS,
        users: MOCK_USERS,
        meetings: MOCK_MEETINGS,
        notifications: MOCK_NOTIFICATIONS,
        invoices: MOCK_INVOICES,
        currentUser: MOCK_USERS[0], // Reset to default user
    }),
}));
