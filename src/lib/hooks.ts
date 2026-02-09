import { useStore } from './store';

export const useOrganizationData = () => {
    const store = useStore();
    const currentOrgId = store.currentOrganization?.id;

    if (!currentOrgId) {
        return {
            ...store,
            projects: [],
            users: [],
            meetings: [],
            notifications: [],
            invoices: [],
            tasks: [],
            reminders: [],
            otherMatters: [],
        };
    }

    return {
        ...store,
        projects: store.projects.filter(p => p.organizationId === currentOrgId),
        users: store.users.filter(u => u.organizationId === currentOrgId),
        meetings: store.meetings.filter(m => m.organizationId === currentOrgId),
        notifications: store.notifications.filter(n => n.organizationId === currentOrgId),
        invoices: store.invoices.filter(i => i.organizationId === currentOrgId),
        reminders: store.reminders.filter(r => r.organizationId === currentOrgId),
        otherMatters: store.otherMatters.filter(o => o.organizationId === currentOrgId),
        // Tasks are nested in projects, but if we need a flat list or other specific filtering:
        // For now, project filtering implicitly filters tasks as they are inside projects.
    };
};
