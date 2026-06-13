'use client';
import { useState } from 'react';
import { Users, Search, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { useListUsersQuery, useSetUserRoleMutation } from '@/lib/redux/api/adminApi';
import type { AuthUser, UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';

const ROLES: UserRole[] = ['customer', 'admin', 'superadmin', 'supplier_rep'];
const ROLE_COLORS: Record<UserRole, string> = {
  customer:     'bg-gray-100 text-gray-600',
  admin:        'bg-blue-100 text-blue-700',
  superadmin:   'bg-purple-100 text-purple-700',
  supplier_rep: 'bg-amber-100 text-amber-700',
};

export default function UsersPage() {
  const me                    = useAppSelector(selectCurrentUser);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('');
  const [changing, setChanging] = useState<string | null>(null);

  const { data: users = [], isLoading } = useListUsersQuery({ search, role: roleFilter || undefined });
  const [setUserRole] = useSetUserRoleMutation();

  async function handleRoleChange(user: AuthUser, role: string) {
    if (user.id === me?.id) { toast.error("You can't change your own role"); return; }
    setChanging(user.id);
    try {
      await setUserRole({ userId: user.id, role }).unwrap();
      toast.success(`${user.firstName}'s role updated to ${role}`);
    } catch { toast.error('Failed to update role'); }
    finally { setChanging(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">User Management</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRole(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full sm:w-48 pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No users found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">User</th>
                <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-semibold">Role</th>
                <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Verified</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                        {user.firstName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        {user.id === me?.id && <p className="text-[10px] text-blue-500">You</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {user.isEmailVerified
                      ? <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      : <ShieldOff className="h-4 w-4 text-gray-300" />
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    {user.id !== me?.id && (
                      <div className="flex items-center gap-2">
                        {changing === user.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          disabled={changing === user.id}
                          className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50"
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
