import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Briefcase, Bell, Settings, Search, Hexagon, Menu, X, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../lib/store';

export function Layout({ children }: { children: React.ReactNode }) {
    const { notifications, currentUser, currentOrganization } = useStore();
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

    // Get initials
    const initials = currentUser?.name
        ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="flex min-h-screen bg-bg-app font-sans">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-navy-900" aria-label="Open menu">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-white">
                            <Hexagon className="w-4 h-4 fill-current" />
                        </div>
                        <span className="text-lg font-bold text-navy-900">{currentOrganization?.name || 'MEITS'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="relative p-2 text-navy-600" aria-label="Notifications">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                        )}
                    </button>
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
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                            <Hexagon className="w-5 h-5 fill-current" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-navy-900 truncate max-w-[150px]" title={currentOrganization?.name}>
                            {currentOrganization?.name || 'MEITS'}
                        </h1>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400" aria-label="Close menu">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-4 mb-6">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                            onKeyDown={handleSidebarSearch}
                            className="w-full bg-slate-50 text-sm text-navy-900 placeholder-slate-400 pl-9 pr-3 py-2.5 rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none transition-all hover:bg-slate-100"
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
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                                location.pathname === item.path
                                    ? "bg-emerald-50 text-emerald-600 font-semibold"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-navy-900"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-105", location.pathname === item.path && "stroke-[2.5px]")} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-slate-50 hover:text-navy-900 transition-all text-sm font-medium">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                    <div className="mt-4 flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-200">
                            {initials}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-navy-900">{currentUser?.name || 'Guest'}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{currentUser?.role || 'Visitor'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen relative pt-16 md:pt-0 transition-all duration-300">
                {/* Header - Desktop Only */}
                <header className="hidden md:flex h-20 items-center justify-between px-8 sticky top-0 bg-bg-app/80 backdrop-blur-md z-20">
                    <div /> {/* Spacer to keep flex-between layout if needed, or just remove if justify-end is preferred. Actually justify-between with empty div works or I can change justify-between to justify-end. Let's just remove the text content div. */}
                    <div className="flex-1" /> {/* Spacer */}

                    <div className="flex items-center gap-4 relative">
                        <Link to="/schedule" className="bg-white p-2.5 rounded-full shadow-sm text-text-muted hover:text-emerald-600 transition-colors border border-slate-100 flex items-center justify-center" aria-label="Calendar">
                            <Calendar className="w-5 h-5" />
                        </Link>

                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={cn("relative p-2.5 rounded-full shadow-sm transition-colors border border-slate-100", showNotifications ? "bg-emerald-50 text-emerald-600" : "bg-white text-text-muted hover:text-emerald-600")}
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-4 w-96 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-semibold text-navy-900">Notifications</h3>
                                    <span className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">{unreadCount} new</span>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-text-muted text-sm">No notifications</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className={cn("p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors", !n.read && "bg-emerald-50/30")}>
                                                <div className="flex gap-3">
                                                    <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-navy-900 font-medium line-clamp-2">{n.message}</p>
                                                        <div className="mt-1.5 flex items-center justify-between gap-4">
                                                            <span className="text-xs text-text-muted">{new Date(n.date).toLocaleDateString()}</span>
                                                            {n.data?.image && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">View Image</span>}
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
                    {children}
                </div>
            </main>
        </div>
    );
}
