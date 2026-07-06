import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare, MessageSquare,
  FileText, Calendar, Megaphone, ShieldCheck, HardHat, BarChart3,
  Users, ClipboardList, ChevronLeft, ChevronRight, LogOut, Moon, Sun,
  ArrowLeftRight, Building2, Menu, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Projects', icon: FolderKanban, path: '/projects' },
  { label: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { label: 'Messages', icon: MessageSquare, path: '/messages' },
  { label: 'Documents', icon: FileText, path: '/documents' },
  { label: 'Calendar', icon: Calendar, path: '/calendar' },
  { label: 'Announcements', icon: Megaphone, path: '/announcements' },
  { label: 'Approvals', icon: ShieldCheck, path: '/approvals' },
  { label: 'Site Reports', icon: HardHat, path: '/site-reports' },
  { label: 'Reports', icon: BarChart3, path: '/reports', roles: ['CEO', 'FINANCE', 'ICT'] },
  { label: 'User Management', icon: Users, path: '/users', roles: ['CEO', 'HR', 'ICT'] },
  { label: 'Audit Logs', icon: ClipboardList, path: '/audit', roles: ['CEO', 'ICT'] },
];

export default function NHCCLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode, setActiveApp } = useSettings();
  const navigate = useNavigate();
  const visibleNavItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role));

  const handleSwitchApp = () => {
    setActiveApp('finara');
    navigate('/finara/dashboard');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 h-full bg-nhcc-gradient text-white flex flex-col
        sidebar-transition
        ${collapsed ? 'w-20' : 'w-72'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform lg:transition-[width]
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-nhcc-gold-400 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-nhcc-blue-900" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <h1 className="font-bold text-lg leading-tight">NHCC</h1>
              <p className="text-[11px] text-blue-200 leading-tight">National Housing & Construction</p>
            </motion.div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden p-1 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {visibleNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-white/20 text-white shadow-lg shadow-blue-900/20'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-white/10 p-3 space-y-1">
          <button
            onClick={handleSwitchApp}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            <ArrowLeftRight className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Switch to Finara</span>}
          </button>
          <button
            onClick={toggleDarkMode}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(prev => !prev)}
            className="hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/10 transition-all justify-center"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User */}
        <div className="border-t border-white/10 p-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-nhcc-gold-400 flex items-center justify-center text-nhcc-blue-900 font-bold text-sm flex-shrink-0">
              {user?.full_name?.[0] || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-[11px] text-blue-200 truncate">{user?.role}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar (mobile) */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-nhcc-blue-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-white">NHCC Portal</span>
          </div>
        </div>

        <div className="p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
