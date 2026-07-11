import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Search, Shield, ShieldOff, Plus, Trash2, X } from 'lucide-react';
import { usersApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const roleColors = { CEO: 'bg-red-100 text-red-700', DEPUTY_CEO: 'bg-orange-100 text-orange-700', CAO: 'bg-amber-100 text-amber-700', HR: 'bg-pink-100 text-pink-700', PROCUREMENT: 'bg-purple-100 text-purple-700', ICT: 'bg-blue-100 text-blue-700', ENGINEERING: 'bg-teal-100 text-teal-700', FINANCE: 'bg-green-100 text-green-700', OPERATIONS: 'bg-indigo-100 text-indigo-700', LAW: 'bg-slate-100 text-slate-700', PIU: 'bg-cyan-100 text-cyan-700', STAFF: 'bg-gray-100 text-gray-600', INTERN: 'bg-lime-100 text-lime-700' };

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'STAFF', department: 'OPERATIONS' });
  
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  
  const createMutation = useMutation({ mutationFn: (data) => usersApi.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setShowForm(false); setForm({ full_name: '', email: '', password: '', role: 'STAFF', department: 'OPERATIONS' }); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => usersApi.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }) });
  const deleteMutation = useMutation({ mutationFn: (id) => usersApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }) });

  const filtered = users.filter(u => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h1><p className="text-slate-500 mt-1">{users.length} users</p></div>
        {(currentUser?.role === 'ICT' || currentUser?.role === 'CEO') && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all"><Plus className="w-4 h-4" /> Add User</button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none">
          <option value="all">All Roles</option>
          {Object.keys(roleColors).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">User</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Role</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Department</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">2FA</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-nhcc-blue-500 flex items-center justify-center text-white font-bold text-sm">{user.full_name?.[0] || '?'}</div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{user.full_name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>{user.role}</span></td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{user.department}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {user.two_factor ? <Shield className="w-4 h-4 text-green-500" /> : <ShieldOff className="w-4 h-4 text-slate-300" />}
                  </td>
                  <td className="px-5 py-3 text-right space-x-3">
                    <button onClick={() => updateMutation.mutate({ id: user.id, data: { ...user, is_active: !user.is_active } })}
                      className={`text-xs font-medium ${user.is_active ? 'text-orange-500 hover:text-orange-700' : 'text-green-500 hover:text-green-700'} transition-colors`}>
                      {user.is_active ? 'Suspend' : 'Activate'}
                    </button>
                    {(currentUser?.role === 'ICT' || currentUser?.role === 'CEO') && (
                      <button onClick={() => { if(window.confirm('Delete user permanently?')) deleteMutation.mutate(user.id); }} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                        Delete
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {filtered.length === 0 && <div className="text-center py-12"><Users className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No users found</p></div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Create New User</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Full Name" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm outline-none dark:text-white focus:ring-2 focus:ring-nhcc-blue-500" />
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email Address" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm outline-none dark:text-white focus:ring-2 focus:ring-nhcc-blue-500" />
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Temporary Password" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm outline-none dark:text-white focus:ring-2 focus:ring-nhcc-blue-500" />
              
              <div className="grid grid-cols-2 gap-3">
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm outline-none dark:text-white focus:ring-2 focus:ring-nhcc-blue-500">
                  {Object.keys(roleColors).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm outline-none dark:text-white focus:ring-2 focus:ring-nhcc-blue-500">
                  <option value="EXECUTIVE">Executive</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="ENGINEERING">Engineering</option>
                  <option value="FINANCE">Finance</option>
                  <option value="ICT">ICT</option>
                </select>
              </div>

              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.email || !form.password} className="w-full py-2.5 bg-nhcc-blue-500 hover:bg-nhcc-blue-600 text-white rounded-xl font-medium transition-all disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
