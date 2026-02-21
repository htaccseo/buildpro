import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Briefcase, Bell, Settings, Search, Hexagon, Menu, X, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../lib/store';
import { UserAvatar } from '../components/UserAvatar';
import { PullToRefresh } from './PullToRefresh';

export function Layout({ children }: { children: React.ReactNode }) {
    const { notifications, currentUser, currentOrganization, markNotificationRead, clearNotifications } = useStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const unreadCount = notifications.filter(n => !n.read).length;
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sidebar Search State
    const [sidebarSearch, setSidebarSearch] = useState(searchParams.get('q') || '');

    // Sync input with URL query param
    useEffect(() => {
        setSidebarSearch(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSidebarSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            navigate(`/projects?q=${encodeURIComponent(sidebarSearch || '')}`);
            setIsMobileMenuOpen(false);
        }
    };





    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Briefcase, label: 'Projects', path: '/projects' },
        { icon: Calendar, label: 'Schedule', path: '/schedule' },
        { icon: FileText, label: 'Invoices', path: '/invoices', hidden: !currentUser?.isAdmin && currentUser?.role !== 'builder' },
        { icon: Users, label: 'Team', path: '/team' },
    ].filter(item => !item.hidden);



    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-bg-app font-sans transition-colors duration-300">
            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 h-16 bg-white border-b border-slate-100 z-40 flex shrink-0 items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-navy-900" aria-label="Open menu">
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link to="/dashboard" className="flex items-center gap-2" aria-label="Go to Dashboard">
                        <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-white">
                            <Hexagon className="w-4 h-4 fill-current" />
                        </div>
                        <span className="text-lg font-extrabold text-navy-900">{currentOrganization?.name || 'meits'}</span>
                    </Link>
                </div>
                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-navy-600"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                        )}
                    </button>

                    {/* Mobile Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 z-50">
                            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-navy-900">Notifications</h3>
                                    {unreadCount > 0 && <span className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">{unreadCount} new</span>}
                                </div>
                                {notifications.length > 0 && (
                                    <button onClick={() => clearNotifications()} className="text-xs text-slate-500 hover:text-rose-500 font-medium transition-colors">
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">No notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={cn("p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors", !n.read && "bg-emerald-50/30")}>
                                            <div className="flex gap-3">
                                                <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                <div>
                                                    <p className="text-sm text-navy-900 font-medium line-clamp-2">{n.message}</p>
                                                    <div className="mt-1.5 flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xs text-slate-500">{new Date(n.date).toLocaleDateString()}</span>
                                                            {n.data?.image && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">View Image</span>}
                                                        </div>
                                                        {!n.read && (
                                                            <button onClick={(e) => { e.stopPropagation(); markNotificationRead(n.id); }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-navy-900 transition-colors" title="Mark as read">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-navy-900/50 z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Responsive */}
            <aside className={cn(
                "fixed top-0 bottom-0 left-0 w-64 bg-white text-navy-900 z-50 flex flex-col shadow-sm border-r border-slate-100 transition-transform duration-300 md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-emerald-500/20 shadow-lg">
                            <Hexagon className="w-5 h-5 fill-current" />
                        </div>
                        <h1 className="text-xl font-extrabold tracking-tight text-navy-900 truncate max-w-[150px]" title={currentOrganization?.name}>
                            {currentOrganization?.name || 'meits'}
                        </h1>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400" aria-label="Close menu">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-4 mb-6 mt-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                            onKeyDown={handleSidebarSearch}
                            className="w-full bg-slate-50 text-sm text-navy-900 placeholder-slate-400 pl-9 pr-3 py-2.5 rounded-full border border-transparent focus:border-emerald-500 focus:outline-none transition-all hover:bg-slate-100"
                        />
                    </div>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 group text-sm font-medium",
                                location.pathname === item.path
                                    ? "bg-black text-white font-bold shadow-lg shadow-black/10"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-navy-900"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-105", location.pathname === item.path && "text-emerald-400")} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-slate-50 hover:text-navy-900 transition-all text-sm font-medium">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                    <div className="mt-4 flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-transparent">
                        <UserAvatar userId={currentUser?.id || ''} className="w-8 h-8 text-xs border border-emerald-200" />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-navy-900">{currentUser?.name || 'Guest'}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{currentUser?.role || 'Visitor'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 relative transition-all duration-300 min-h-screen">
                {/* Header - Desktop Only */}
                <header className="hidden md:flex h-20 items-center justify-between px-8 sticky top-0 bg-bg-app/80 backdrop-blur-md z-20 transition-colors duration-300">
                    <div /> {/* Spacer */}
                    <div className="flex-1" /> {/* Spacer */}

                    <div className="flex items-center gap-4 relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={cn("relative p-2.5 rounded-full shadow-sm transition-colors border border-slate-100", showNotifications ? "bg-emerald-50 text-emerald-600" : "bg-white text-slate-400 hover:text-emerald-600")}
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-4 w-96 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 z-50">
                                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-navy-900">Notifications</h3>
                                        {unreadCount > 0 && <span className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">{unreadCount} new</span>}
                                    </div>
                                    {notifications.length > 0 && (
                                        <button onClick={() => clearNotifications()} className="text-xs text-slate-500 hover:text-rose-500 font-medium transition-colors">
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 text-sm">No notifications</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className={cn("p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors", !n.read && "bg-emerald-50/30")}>
                                                <div className="flex gap-3">
                                                    <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-navy-900 font-medium line-clamp-2">{n.message}</p>
                                                        <div className="mt-1.5 flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs text-slate-500">{new Date(n.date).toLocaleDateString()}</span>
                                                                {n.data?.image && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">View Image</span>}
                                                            </div>
                                                            {!n.read && (
                                                                <button onClick={(e) => { e.stopPropagation(); markNotificationRead(n.id); }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-navy-900 transition-colors" title="Mark as read">
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <PullToRefresh>
                        {children}
                    </PullToRefresh>
                </div>
            </main>
        </div>
    );
}
