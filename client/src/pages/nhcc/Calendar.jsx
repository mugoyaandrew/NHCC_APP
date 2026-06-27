import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay } from 'date-fns';
import { tasksApi } from '../../lib/api';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.list() });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getTasksForDay = (day) => tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day));
  const selectedTasks = getTasksForDay(selectedDay);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Calendar</h1></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"><ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"><ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
            ))}
            {days.map((day, i) => {
              const dayTasks = getTasksForDay(day);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const isSelected = isSameDay(day, selectedDay);
              return (
                <button key={i} onClick={() => setSelectedDay(day)}
                  className={`relative p-2 h-16 rounded-xl text-sm transition-all
                    ${!inMonth ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}
                    ${today ? 'bg-nhcc-blue-500 text-white font-bold' : ''}
                    ${isSelected && !today ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' : ''}
                    hover:bg-slate-50 dark:hover:bg-slate-700/50
                  `}>
                  <span className="text-xs">{format(day, 'd')}</span>
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-1">
                      {dayTasks.slice(0, 3).map((_, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
            {format(selectedDay, 'EEEE, MMM d')}
          </h3>
          {selectedTasks.length > 0 ? (
            <div className="space-y-3">
              {selectedTasks.map(task => (
                <motion.div key={task.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{task.title}</p>
                  {task.project_name && <p className="text-xs text-slate-400 mt-1">📁 {task.project_name}</p>}
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{task.priority}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400"><CalIcon className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No tasks for this day</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
