import type { Project, User, Meeting, Notification, Organization } from './types';
import { addDays, format } from 'date-fns';

export const MOCK_ORGANIZATION: Organization = {
    id: 'org1',
    name: 'BuildPro Constructions',
    createdAt: new Date().toISOString()
};

const ORG_ID = MOCK_ORGANIZATION.id;

export const MOCK_USERS: User[] = [
    { id: 'u1', organizationId: ORG_ID, name: 'John Builder', email: 'john@buildpro.com', role: 'builder', company: 'BuildPro Constructions', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&crop=faces' },
    { id: 'u2', organizationId: ORG_ID, name: 'Mike Carpenter', email: 'mike@buildpro.com', role: 'worker', company: 'BuildPro Constructions', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=256&h=256&fit=crop&crop=faces' },
    { id: 'u3', organizationId: ORG_ID, name: 'Sarah Electrician', email: 'sarah@buildpro.com', role: 'worker', company: 'BuildPro Constructions', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces' },
    { id: 'u4', organizationId: ORG_ID, name: 'Dave Plumber', email: 'dave@buildpro.com', role: 'worker', company: 'BuildPro Constructions', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces' },
    { id: 'u_admin', organizationId: ORG_ID, name: 'Super Admin', email: 'me@example.com', role: 'builder', company: 'BuildPro Constructions', avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=000&color=fff', isAdmin: true, isSuperAdmin: true },
];

export const MOCK_PROJECTS: Project[] = [
    {
        id: 'p1',
        organizationId: ORG_ID,
        name: 'Modern Villa Renovation',
        address: '123 Ocean Drive, Sydney',
        clientName: 'Mr. Smith',
        clientEmail: 'smith@example.com',
        clientPhone: '+61 400 123 456',
        status: 'active',
        progress: 35,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
        color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        tasks: [
            { id: 't1', projectId: 'p1', title: 'Install Kitchen Frames', description: 'Setup the main frames for the kitchen area', status: 'pending', requiredDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), assignedTo: 'u2' },
            { id: 't2', projectId: 'p1', title: 'Electrical Wiring', description: 'Rough-in for living room', status: 'in-progress', requiredDate: format(new Date(), 'yyyy-MM-dd'), assignedTo: 'u3' },
        ]
    },
    {
        id: 'p2',
        organizationId: ORG_ID,
        name: 'City Apartment Complex',
        address: '45 High St, Melbourne',
        clientName: 'Urban Corp',
        clientEmail: 'contact@urbancorp.com',
        clientPhone: '+61 3 9999 8888',
        status: 'active',
        progress: 78,
        startDate: format(addDays(new Date(), -60), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        tasks: [
            { id: 't3', projectId: 'p2', title: 'Final Plumbing Check', description: 'Inspect all bathrooms', status: 'completed', requiredDate: format(addDays(new Date(), -1), 'yyyy-MM-dd'), assignedTo: 'u4', completedAt: format(addDays(new Date(), -1), 'yyyy-MM-dd'), completionNote: 'All sealed and tested.', completionImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400' },
        ]
    },
    {
        id: 'p3',
        organizationId: ORG_ID,
        name: 'Downtown Office Fitout',
        address: '88 Market St, Sydney',
        clientName: 'TechFlow Inc',
        clientEmail: 'admin@techflow.com',
        clientPhone: '+61 2 9999 7777',
        status: 'completed',
        progress: 100,
        startDate: format(addDays(new Date(), -120), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), -30), 'yyyy-MM-dd'),
        color: 'bg-slate-700',
        tasks: []
    }
];

export const MOCK_MEETINGS: Meeting[] = [
    { id: 'm1', organizationId: ORG_ID, title: 'Site Inspection', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', projectId: 'p1', attendees: ['u1', 'u2'] },
    { id: 'm2', organizationId: ORG_ID, title: 'Client Briefing', date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), time: '14:00', projectId: 'p2', attendees: ['u1'] },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n1', organizationId: ORG_ID, userId: 'u1', message: 'Dave completed "Final Plumbing Check"', read: false, date: format(addDays(new Date(), -1), 'yyyy-MM-dd'), type: 'task_completed', data: { taskId: 't3' } }
];
