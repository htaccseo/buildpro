import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { useOrganizationData } from '../lib/hooks';
import { Card } from '../components/ui/Card';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Plus } from 'lucide-react';
import { NewMeetingModal } from '../components/NewMeetingModal';
import { UserAvatar } from '../components/UserAvatar';
import { ReminderModal } from '../components/ReminderModal';
import type { Reminder } from '../lib/types';

export function Schedule() {
    const navigate = useNavigate();
    // Use Clean Data Hook (RLS)
    const { projects, meetings, reminders } = useOrganizationData();
    // Store actions
    const { toggleReminder } = useStore();

    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [isMeetingModalOpen, setIsMeetingModalOpen] = React.useState(false);
    const [selectedReminder, setSelectedReminder] = React.useState<Reminder | null>(null);
    const [isReminderModalOpen, setIsReminderModalOpen] = React.useState(false);

    const startDate = startOfWeek(currentDate);
    const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));

    // Get all tasks with project info
    const allTasks = projects.flatMap(p => p.tasks.map(t => ({
        ...t,
        projectId: p.id,
        projectColor: p.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400',
        projectName: p.name
    })));

    const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const prevWeek = () => setCurrentDate(addDays(currentDate, -7));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-navy-900 mb-2">Schedule</h1>
                    <p className="text-text-muted">Track project timelines and upcoming deadlines.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setSelectedReminder(null);
                            setIsReminderModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors font-medium border border-indigo-100"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Reminder</span>
                    </button>
                    <button
                        onClick={() => setIsMeetingModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Meeting</span>
                    </button>

                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button onClick={prevWeek} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-navy-600">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-4 font-medium text-navy-900 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-emerald-500" />
                            {format(startDate, 'MMM d')} - {format(addDays(startDate, 6), 'MMM d, yyyy')}
                        </div>
                        <button onClick={nextWeek} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-navy-600">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <Card className="p-6 overflow-x-auto border-none shadow-sm">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 gap-4 mb-6">
                        {weekDays.map((day, i) => (
                            <div key={i} className={`text-center p-3 rounded-xl border ${isSameDay(day, new Date()) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-transparent'}`}>
                                <div className={`text-xs font-semibold uppercase mb-1 ${isSameDay(day, new Date()) ? 'text-emerald-600' : 'text-text-muted'}`}>
                                    {format(day, 'EEE')}
                                </div>
                                <div className={`text-xl font-bold ${isSameDay(day, new Date()) ? 'text-emerald-700' : 'text-navy-900'}`}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {/* Time slots or just list tasks per day */}
                        <div className="grid grid-cols-7 gap-4 min-h-[400px]">
                            {weekDays.map((day, i) => {
                                const dayTasks = allTasks.filter(t => isSameDay(new Date(t.requiredDate), day));
                                const dayMeetings = meetings.filter(m => isSameDay(new Date(m.date), day));
                                const dayReminders = reminders
                                    .filter(r => isSameDay(new Date(r.date), day))
                                    .sort((a, b) => {
                                        if (a.completed === b.completed) return 0;
                                        return a.completed ? 1 : -1;
                                    });

                                return (
                                    <div key={i} className="space-y-2">
                                        {/* Meetings */}
                                        {dayMeetings.map(meeting => (
                                            <div
                                                key={meeting.id}
                                                className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-default group"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 text-emerald-600" />
                                                        <span className="text-xs font-bold text-emerald-700">{meeting.time}</span>
                                                    </div>
                                                    <UserAvatar userId={meeting.createdBy} className="h-4 w-4 text-[8px]" />
                                                </div>
                                                <h4 className="font-semibold text-sm text-navy-900 line-clamp-2">{meeting.title}</h4>
                                                {meeting.address && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-text-muted truncate">
                                                        <MapPin className="w-3 h-3" />
                                                        {meeting.address}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Reminders */}
                                        {dayReminders.map(reminder => (
                                            <div
                                                key={reminder.id}
                                                className={cn(
                                                    "p-3 rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer group",
                                                    reminder.completed
                                                        ? "bg-slate-50 border-slate-100 opacity-75"
                                                        : "bg-indigo-50 border-indigo-100"
                                                )}
                                                onClick={() => {
                                                    setSelectedReminder(reminder);
                                                    setIsReminderModalOpen(true);
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={cn("w-2 h-2 rounded-full", reminder.completed ? "bg-slate-300" : "bg-indigo-500")}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleReminder(reminder.id);
                                                            }}
                                                            title={reminder.completed ? "Mark as incomplete" : "Mark as done"}
                                                        />
                                                        <span className={cn("text-xs font-bold", reminder.completed ? "text-text-muted" : "text-indigo-700")}>
                                                            Reminder
                                                        </span>
                                                    </div>
                                                    <UserAvatar userId={reminder.createdBy} className="h-4 w-4 text-[8px]" />
                                                </div>
                                                <h4 className={cn("font-semibold text-sm line-clamp-2", reminder.completed ? "text-text-muted line-through" : "text-navy-900")}>
                                                    {reminder.title}
                                                </h4>
                                                {reminder.description && (
                                                    <p className={cn("text-xs mt-1 line-clamp-1", reminder.completed ? "text-text-muted" : "text-navy-600")}>
                                                        {reminder.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}

                                        {/* Tasks */}
                                        {dayTasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => navigate(`/projects/${task.projectId}`)}
                                                className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                            >
                                                <div className={`w-full h-1.5 rounded-full mb-2 ${task.projectColor}`} />
                                                <h4 className="font-semibold text-sm text-navy-900 line-clamp-2 mb-1 group-hover:text-emerald-600 transition-colors">{task.title}</h4>
                                                <p className="text-xs text-text-muted line-clamp-1">{task.projectName}</p>
                                            </div>
                                        ))}
                                        {dayTasks.length === 0 && dayMeetings.length === 0 && dayReminders.length === 0 && (
                                            <div className="h-full rounded-xl border-2 border-dashed border-slate-50 min-h-[100px]" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Card>

            <NewMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
            />

            {/* Reminder Modal (Add/Edit) */}
            <ReminderModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                existingReminder={selectedReminder}
            />
        </div>
    );
}
