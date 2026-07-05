import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [currency, setCurrency] = useState('UGX');
  const [darkMode, setDarkMode] = useState(false);
  const [activeApp, setActiveApp] = useState('nhcc'); // 'nhcc' or 'finara'

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return `${currency} 0`;
    return `${currency} ${Number(amount).toLocaleString('en-US')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-UG', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{
      currency, setCurrency, darkMode, toggleDarkMode,
      activeApp, setActiveApp, formatCurrency, formatDate
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
