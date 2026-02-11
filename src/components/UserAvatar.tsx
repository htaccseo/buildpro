
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';

interface UserAvatarProps {
    userId?: string;
    className?: string;
    showName?: boolean;
}

export function UserAvatar({ userId, className, showName = false }: UserAvatarProps) {
    const { users, currentUser } = useStore();

    // If no userId provided, or user not found, return null or a placeholder
    if (!userId) return null;

    const user = users.find(u => u.id === userId) || (currentUser?.id === userId ? currentUser : null);

    if (!user) return null;

    const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className={cn("flex items-center gap-2", className)} title={`Created by ${user.name}`}>
            {user.avatar ? (
                <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-white shadow-sm"
                />
            ) : (
                <div className="w-6 h-6 rounded-full bg-navy-900 text-white flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                    {initials}
                </div>
            )}
            {showName && <span className="text-xs text-navy-700 font-medium">{user.name}</span>}
        </div>
    );
}
