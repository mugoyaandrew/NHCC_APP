import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Search, Shield, ShieldOff } from 'lucide-react';
import { usersApi } from '../../lib/api';

const roleColors = { CEO: 'bg-red-100 text-red-700', DEPUTY_CEO: 'bg-orange-100 text-orange-700', CAO: 'bg-amber-100 text-amber-700', HR: 'bg-pink-100 text-pink-700', PROCUREMENT: 'bg-purple-100 text-purple-700', ICT: 'bg-blue-100 text-blue-700', ENGINEERING: 'bg-teal-100 text-teal-700', FINANCE: 'bg-green-100 text-green-700', OPERATIONS: 'bg-indigo-100 text-indigo-700', LAW: 'bg-slate-100 text-slate-700', PIU: 'bg-cyan-100 text-cyan-700', STAFF: 'bg-gray-100 text-gray-600', INTERN: 'bg-lime-100 text-lime-700' };

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => usersApi.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }) });

  const filtered = users.filter(u => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h1><p className="text-slate-500 mt-1">{users.length} users</p></div>

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
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => updateMutation.mutate({ id: user.id, data: { ...user, is_active: !user.is_active } })}
                      className={`text-xs font-medium ${user.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'} transition-colors`}>
                      {user.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {filtered.length === 0 && <div className="text-center py-12"><Users className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No users found</p></div>}
    </div>
  );
}
