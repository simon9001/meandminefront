'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  Users, Search, Loader2, Plus, Pencil, Trash2,
  ShieldCheck, ShieldOff, X,
} from 'lucide-react';
import {
  useListUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useCreateUserMutation,
} from '@/lib/redux/api/adminApi';
import type { AdminUser, UserRole, AuthUser } from '@/lib/types';
import { toast } from 'sonner';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';

// Roles admins can assign — superadmin is never shown as an option
const ASSIGNABLE_ROLES: UserRole[] = ['customer', 'admin', 'supplier_rep'];
const ALL_DISPLAY_ROLES: UserRole[] = ['customer', 'admin', 'supplier_rep'];

const ROLE_COLORS: Record<UserRole, string> = {
  customer:     'bg-gray-100 text-gray-600',
  admin:        'bg-blue-100 text-blue-700',
  superadmin:   'bg-purple-100 text-purple-700',
  supplier_rep: 'bg-amber-100 text-amber-700',
};

const ROLE_LABELS: Record<UserRole, string> = {
  customer:     'Customer',
  admin:        'Admin',
  superadmin:   'Super Admin',
  supplier_rep: 'Supplier Rep',
};

const AVATAR_COLORS = [
  'bg-forest-100 text-forest-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-purple-100 text-purple-700',
  'bg-cyan-100 text-cyan-700',
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: AdminUser }) {
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const colorClass = AVATAR_COLORS[(user.firstName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  if (user.avatarUrl) {
    return (
      <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white">
        <Image src={user.avatarUrl} alt={initials} width={36} height={36} className="object-cover w-full h-full" />
      </div>
    );
  }
  return (
    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colorClass}`}>
      {initials}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-forest-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function EditUserModal({
  user, me, onClose, onSave, isSaving,
}: {
  user: AdminUser;
  me: AuthUser | null;
  onClose: () => void;
  onSave: (data: { firstName: string; lastName: string; phone: string; isActive: boolean; role: string }) => Promise<void>;
  isSaving: boolean;
}) {
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName,  setLastName]  = useState(user.lastName ?? '');
  const [phone,     setPhone]     = useState(user.phone ?? '');
  const [isActive,  setIsActive]  = useState(user.isActive);
  const [role,      setRole]      = useState<string>(user.role);

  const isOwnProfile  = user.id === me?.id;
  const isSuperAdmin  = user.role === 'superadmin';
  const canChangeRole = !isOwnProfile && !isSuperAdmin;

  return (
    <Modal title={`Edit ${user.firstName} ${user.lastName}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254…"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>

        {canChangeRole && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Active Account</p>
            <p className="text-xs text-gray-500">Inactive users cannot log in</p>
          </div>
          <ToggleSwitch checked={isActive} onChange={setIsActive} />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isSaving || !firstName.trim() || !lastName.trim()}
            onClick={() => onSave({ firstName, lastName, phone, isActive, role })}
            className="px-4 py-2 text-sm font-semibold text-white bg-forest-700 rounded-xl hover:bg-forest-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add User Modal ─────────────────────────────────────────────────────────────

function AddUserModal({
  onClose, onSave, isSaving,
}: {
  onClose: () => void;
  onSave: (data: { email: string; password: string; firstName: string; lastName: string; role: string; phone?: string }) => Promise<void>;
  isSaving: boolean;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [role,      setRole]      = useState<string>('customer');

  const isValid = firstName.trim() && lastName.trim() && email.trim() && password.length >= 8;

  return (
    <Modal title="Add New User" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
          {password.length > 0 && password.length < 8 && (
            <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254…"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isSaving || !isValid}
            onClick={() => onSave({ email, password, firstName, lastName, role, phone: phone || undefined })}
            className="px-4 py-2 text-sm font-semibold text-white bg-forest-700 rounded-xl hover:bg-forest-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create User
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const me = useAppSelector(selectCurrentUser);

  const [search,   setSearch]   = useState('');
  const [roleFilter, setRole]   = useState('');
  const [editUser,  setEditUser]  = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [showAdd,  setShowAdd]  = useState(false);

  const { data: users = [], isLoading } = useListUsersQuery({ search, role: roleFilter || undefined });
  const [updateUser,  { isLoading: isUpdating }]  = useUpdateUserMutation();
  const [deleteUser,  { isLoading: isDeleting }]  = useDeleteUserMutation();
  const [createUser,  { isLoading: isCreating }]  = useCreateUserMutation();

  async function handleSaveEdit(data: { firstName: string; lastName: string; phone: string; isActive: boolean; role: string }) {
    if (!editUser) return;
    try {
      await updateUser({
        userId:    editUser.id,
        firstName: data.firstName,
        lastName:  data.lastName,
        phone:     data.phone || null,
        isActive:  data.isActive,
        role:      editUser.role === 'superadmin' ? undefined : data.role,
      }).unwrap();
      toast.success('User updated');
      setEditUser(null);
    } catch {
      toast.error('Failed to update user');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id).unwrap();
      toast.success('User deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete user');
    }
  }

  async function handleCreate(data: { email: string; password: string; firstName: string; lastName: string; role: string; phone?: string }) {
    try {
      await createUser(data).unwrap();
      toast.success('User created successfully');
      setShowAdd(false);
    } catch {
      toast.error('Failed to create user');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-forest-700 text-white rounded-xl text-sm font-semibold hover:bg-forest-800 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRole(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          <option value="">All roles</option>
          {ALL_DISPLAY_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No users found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider bg-gray-50/60">
                  <th className="text-left px-5 py-3 font-semibold">User</th>
                  <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 font-semibold">Role</th>
                  <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Status</th>
                  <th className="text-left px-5 py-3 font-semibold hidden xl:table-cell">Joined</th>
                  <th className="px-5 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => {
                  const isSelf        = user.id === me?.id;
                  const isSuperAdmin  = user.role === 'superadmin';
                  const amSuperAdmin  = me?.role === 'superadmin';
                  // Regular admins cannot delete other admins — only superadmin can
                  const canDelete     = !isSelf && !isSuperAdmin && (user.role !== 'admin' || amSuperAdmin);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* User — avatar + name + email */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-medium text-gray-900 truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              {isSelf && (
                                <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                                  You
                                </span>
                              )}
                              {user.isEmailVerified
                                ? <ShieldCheck className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                : <ShieldOff   className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 text-gray-500 text-xs hidden lg:table-cell">
                        {user.phone || <span className="text-gray-300">—</span>}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>

                      {/* Active status */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? 'text-green-600' : 'text-red-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-3.5 text-gray-400 text-xs hidden xl:table-cell whitespace-nowrap">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditUser(user)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit user"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => setDeleteTarget(user)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          me={me}
          onClose={() => setEditUser(null)}
          onSave={handleSaveEdit}
          isSaving={isUpdating}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Delete User" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 mb-2">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-gray-900">
              {deleteTarget.firstName} {deleteTarget.lastName}
            </span>?
          </p>
          <p className="text-xs text-gray-400 mb-6">
            {deleteTarget.email} · This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isDeleting}
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete User
            </button>
          </div>
        </Modal>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onSave={handleCreate}
          isSaving={isCreating}
        />
      )}
    </div>
  );
}
