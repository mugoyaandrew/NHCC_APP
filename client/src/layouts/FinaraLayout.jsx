import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, CreditCard, TrendingUp, Target,
  Landmark, LineChart, Settings, ChevronLeft, ChevronRight,
  LogOut, Moon, Sun, ArrowLeftRight, Leaf, Menu, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/finara/dashboard' },
  { label: 'Income', icon: Wallet, path: '/finara/income' },
  { label: 'Expenses', icon: CreditCard, path: '/finara/expenses' },
  { label: 'Analytics', icon: TrendingUp, path: '/finara/analytics' },
  { label: 'Goals', icon: Target, path: '/finara/goals' },
  { label: 'Accounts', icon: Landmark, path: '/finara/accounts' },
  { label: 'Investments', icon: LineChart, path: '/finara/investments' },
  { label: 'Settings', icon: Settings, path: '/finara/settings' },
];

export default function FinaraLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode, setActiveApp } = useSettings();
  const navigate = useNavigate();

  const handleSwitchApp = () => {
    setActiveApp('nhcc');
    navigate('/dashboard');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950 overflow-hidden">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={`
        fixed lg:relative z-50 h-full bg-finara-gradient text-white flex flex-col sidebar-transition
        ${collapsed ? 'w-20' : 'w-72'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform lg:transition-[width]
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-sage-400 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-bold text-lg leading-tight">Finara</h1>
              <p className="text-[11px] text-slate-400 leading-tight">Financial Co-Pilot</p>
            </motion.div>
          )}
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden p-1 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive ? 'bg-sage-500/30 text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
          <button onClick={handleSwitchApp}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
            <ArrowLeftRight className="w-5 h-5" />
            {!collapsed && <span>Switch to NHCC</span>}
          </button>
          <button onClick={toggleDarkMode}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button onClick={() => setCollapsed(p => !p)}
            className="hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/10 transition-all justify-center">
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-sage-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.full_name?.[0] || 'U'}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <button onClick={logout} className="p-1.5 hover:bg-white/10 rounded-lg" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-white">Finara</span>
          </div>
        </div>
        <div className="p-4 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
