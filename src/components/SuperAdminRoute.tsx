import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../lib/store';

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
    const { currentUser } = useStore();

    if (!currentUser || !currentUser.isSuperAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
