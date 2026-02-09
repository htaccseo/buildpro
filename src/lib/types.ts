export interface Organization {
    id: string;
    name: string;
    createdAt: string;
}

export type UserRole = 'builder' | 'worker';

export interface User {
    id: string;
    organizationId: string;
    name: string;
    email: string;
    role: UserRole;
    avatar: string;
    phone?: string;
    company?: string;
    password?: string;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
}

export interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string;
    assignedTo?: string; // Worker ID
    status: 'pending' | 'in-progress' | 'completed';
    requiredDate: string; // ISO Date
    completedAt?: string;
    completionNote?: string;
    completionImage?: string;
}

export interface ProjectUpdate {
    id: string;
    message: string;
    date: string; // ISO Date
    authorName: string;
}

export interface Project {
    id: string;
    organizationId: string;
    name: string;
    address: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    status: 'active' | 'completed' | 'on-hold';
    progress: number; // 0-100
    startDate: string;
    endDate: string;
    color: string; // Tailwind gradient classes
    tasks: Task[];
    updates?: ProjectUpdate[];
}

export interface Meeting {
    id: string;
    organizationId: string;
    title: string;
    date: string; // ISO Date
    time: string;
    projectId?: string;
    attendees: string[]; // User IDs
    address?: string;
}

export interface Notification {
    id: string;
    organizationId: string;
    userId: string;
    message: string;
    read: boolean;
    date: string;
    type: 'task_completed' | 'urgent';
    data?: any;
}

export interface Invoice {
    id: string;
    organizationId: string;
    type: 'sent' | 'received'; // sent = receivable (from client), received = payable (to contractor)
    amount: number;
    clientName: string; // Client or Contractor Name
    dueDate: string; // ISO Date
    status: 'paid' | 'pending' | 'overdue';
    date: string; // Issue Date
    description: string;
    projectId?: string;
}

export interface Reminder {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    date: string; // ISO Date
    completed: boolean;
}

export interface OtherMatter {
    id: string;
    organizationId: string;
    title: string;
    address: string;
    note: string;
    date: string;
}
