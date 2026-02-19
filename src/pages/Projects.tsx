import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { useOrganizationData } from '../lib/hooks';
import { Search, Plus, Calendar, MapPin, CheckCircle, RotateCcw, Home, Store, Activity } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { NewProjectModal } from '../components/NewProjectModal';
import { UserAvatar } from '../components/UserAvatar';

export function Projects() {
    const { projects } = useOrganizationData();
    const { updateProject } = useStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const query = searchParams.get('q') || '';

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.address.toLowerCase().includes(query.toLowerCase()) ||
        p.clientName.toLowerCase().includes(query.toLowerCase())
    );

    const activeProjects = filteredProjects.filter(p => p.status === 'active' || p.status === 'on-hold');
    const completedProjects = filteredProjects.filter(p => p.status === 'completed');

    const toggleProjectStatus = (e: React.MouseEvent, project: typeof projects[0]) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
        updateProject({
            ...project,
            status: project.status === 'completed' ? 'active' : 'completed'
        });
    };

    return (
        <div className="space-y-8">
            <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-navy-900 mb-2">Projects</h1>
                    <p className="text-text-muted">Manage your active construction sites and requirements.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={query}
                            onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
                            className="bg-white border border-slate-200 text-navy-900 pl-10 pr-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full md:w-64 placeholder:text-gray-400 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-full font-medium flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Project</span>
                    </button>
                </div>
            </div>

            {/* Search Results Empty State */}
            {query && filteredProjects.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-navy-900 font-medium">No projects found</p>
                    <p className="text-text-muted text-sm">We couldn't find any projects matching "{query}"</p>
                </div>
            )}

            {/* Active Projects */}
            {(activeProjects.length > 0 || (!query && activeProjects.length === 0)) && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-navy-900 border-b border-slate-100 pb-2">Active Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeProjects.map((project) => (
                            <Link
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className="group block"
                            >
                                <Card className="p-0 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-sm h-full flex flex-col">
                                    <div className={cn("h-24 relative shrink-0 flex items-end p-4 transition-all duration-700",
                                        project.color.includes('emerald') ? "bg-emerald-500" :
                                            (project.color.includes('blue') || project.color.includes('navy')) ? "bg-navy-900" : project.color
                                    )}>
                                        <div className="absolute top-0 left-0 w-full h-full bg-black/5" />

                                        <div className="relative z-10 w-full">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={cn(
                                                    "inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize backdrop-blur-sm",
                                                    project.status === 'active'
                                                        ? (project.color.includes('emerald') ? "bg-navy-900 text-white" : "bg-emerald-500 text-navy-900")
                                                        : project.status === 'completed' ? "bg-slate-900/40 text-white" : "bg-amber-500/80 text-white"
                                                )}>
                                                    {project.status}
                                                </span>

                                                {/* Smaller Icon next to badge */}
                                                {project.color.includes('emerald') ? (
                                                    <Home className="w-5 h-5 text-navy-900 opacity-80" />
                                                ) : (project.color.includes('blue') || project.color.includes('navy')) ? (
                                                    <Store className="w-5 h-5 text-emerald-500 opacity-80" />
                                                ) : (
                                                    <Activity className="w-5 h-5 text-white/80" />
                                                )}
                                            </div>

                                            <h3 className={cn(
                                                "text-xl font-bold truncate drop-shadow-sm",
                                                project.color.includes('emerald') ? "text-navy-900" :
                                                    (project.color.includes('blue') || project.color.includes('navy')) ? "text-emerald-500" : "text-white"
                                            )}>{project.name}</h3>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4 flex-1 flex flex-col">
                                        <div className="flex items-start gap-3 text-text-muted text-sm">
                                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{project.address}</span>
                                        </div>

                                        <div className="flex items-center gap-3 text-text-muted text-sm">
                                            <Calendar className="w-4 h-4 shrink-0" />
                                            <span>{formatDate(project.startDate, 'MMM d')} - {formatDate(project.endDate, 'MMM d, yyyy')}</span>
                                        </div>

                                        <div className="space-y-2 mt-auto">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-text-muted">Progress</span>
                                                <span className="text-navy-900 font-medium">{project.progress}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }} />
                                            </div>
                                            <button
                                                onClick={(e) => toggleProjectStatus(e, project)}
                                                className="w-full mt-2 py-2 rounded-lg border border-slate-200 text-sm font-medium text-navy-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Mark Complete
                                            </button>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                <div className="flex -space-x-2">
                                                    {/* Item 6: Actual Creator + Assignees */}
                                                    {Array.from(new Set([
                                                        project.createdBy,
                                                        ...(project.tasks || []).map(t => t.assignedTo)
                                                    ])).filter(Boolean).slice(0, 4).map((userId) => (
                                                        <UserAvatar
                                                            key={userId as string}
                                                            userId={userId as string}
                                                            className="w-8 h-8 text-xs border-2 border-white shadow-sm"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-sm text-emerald-600 group-hover:text-emerald-700 font-medium">View Details &rarr;</span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                        {activeProjects.length === 0 && !query && (
                            <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-text-muted">No active projects.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Completed Projects */}
            {completedProjects.length > 0 && (
                <div className={cn("space-y-6", (activeProjects.length > 0 || !query) && "pt-8 border-t border-slate-200")}>
                    <h2 className="text-xl font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Completed Projects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedProjects.map((project) => (
                            <Link
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className="group block grayscale hover:grayscale-0 transition-all duration-500"
                            >
                                <Card className="p-0 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-sm h-full flex flex-col opacity-75 hover:opacity-100">
                                    <div className={cn("h-24 relative shrink-0 flex items-end p-4 bg-slate-800")}>
                                        <div className="absolute top-0 left-0 w-full h-full bg-black/10" />
                                        <div className="relative z-10 w-full">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-emerald-500/90 text-white backdrop-blur-sm">
                                                    Completed
                                                </span>
                                                <CheckCircle className="w-5 h-5 text-white/50" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white truncate drop-shadow-sm">{project.name}</h3>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4 flex-1 flex flex-col bg-slate-50">
                                        <div className="flex items-start gap-3 text-text-muted text-sm">
                                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{project.address}</span>
                                        </div>

                                        <div className="space-y-2 mt-auto">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-text-muted">Progress</span>
                                                <span className="text-emerald-600 font-bold">100%</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full w-full" />
                                            </div>
                                            <button
                                                onClick={(e) => toggleProjectStatus(e, project)}
                                                className="w-full mt-2 py-2 rounded-lg border border-slate-200 text-sm font-medium text-navy-600 hover:bg-white hover:text-amber-600 hover:border-amber-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Reactivate Project
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
