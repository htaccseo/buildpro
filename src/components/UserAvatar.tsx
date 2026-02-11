
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';

interface UserAvatarProps {
    userId?: string;
    className?: string;
    showName?: boolean;
}

export function UserAvatar({ userId, className, showName = false }: UserAvatarProps) {
    const { users, currentUser } = useStore();

    if (!userId) return null;

    const user = users.find(u => u.id === userId) || (currentUser?.id === userId ? currentUser : null);

    if (!user) return null;

    const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const isCurrentUser = currentUser?.id === user.id;

    // Generate a consistent color based on the user's name
    const colors = [
        'bg-amber-400 text-white',
        'bg-rose-400 text-white',
        'bg-emerald-400 text-white',
        'bg-blue-400 text-white',
        'bg-indigo-400 text-white',
        'bg-violet-400 text-white',
    ];
    let colorIndex = 0;
    for (let i = 0; i < user.name.length; i++) {
        colorIndex = (colorIndex + user.name.charCodeAt(i)) % colors.length;
    }
    const colorClass = colors[colorIndex];

    return (
        <div className="flex items-center gap-3">
            <div className="relative">
                <div
                    className={cn(
                        "rounded-full flex items-center justify-center font-bold shadow-sm border-2 border-white",
                        colorClass,
                        className || "w-10 h-10 text-sm"
                    )}
                    title={user.name}
                >
                    {initials}
                </div>
                {isCurrentUser && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                        YOU
                    </div>
                )}
            </div>
            {showName && (
                <div>
                    <p className="text-sm font-semibold text-navy-900 leading-tight">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
            )}
        </div>
    );
}
