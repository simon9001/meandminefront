'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2, Save, Camera } from 'lucide-react';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { selectCurrentUser, selectToken, setCredentials } from '@/lib/redux/slices/authSlice';
import { useGetProfileQuery, useUpdateProfileMutation } from '@/lib/redux/api/adminApi';
import { toast } from 'sonner';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

export default function ProfilePage() {
  const user     = useAppSelector(selectCurrentUser);
  const token    = useAppSelector(selectToken);
  const dispatch = useAppDispatch();
  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();

  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [avatarUrl,  setAvatarUrl]  = useState<string | undefined>(undefined);
  const [uploading,  setUploading]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const source = profile ?? user;
    if (source) {
      setFirstName(source.firstName ?? '');
      setLastName(source.lastName ?? '');
      setAvatarUrl(source.avatarUrl ?? undefined);
    }
  }, [profile, user]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(`${API}/upload/avatar`, {
        method:  'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body:    fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? json.message ?? 'Upload failed');
      const url = json.data.avatarUrl as string;
      setAvatarUrl(url);
      if (user && token) {
        dispatch(setCredentials({ user: { ...user, avatarUrl: url }, token }));
      }
      toast.success('Avatar updated');
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSave() {
    const first = firstName.trim();
    const last  = lastName.trim();
    if (!first || !last) return;
    try {
      const updated = await updateProfile({ firstName: first, lastName: last }).unwrap();
      if (user && token) {
        dispatch(setCredentials({ user: { ...user, ...updated, avatarUrl }, token }));
      }
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
  }

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-lg font-bold text-gray-900">My Profile</h2>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">

        {/* Avatar upload */}
        <div className="flex items-center gap-4">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative h-16 w-16 rounded-full flex-shrink-0 group focus:outline-none"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                fill
                className="rounded-full object-cover"
                sizes="64px"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-forest-600 flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            {/* Hover overlay */}
            <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading
                ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                : <Camera className="h-5 w-5 text-white" />}
            </span>
          </button>
          <div>
            <p className="font-semibold text-gray-900">{firstName} {lastName}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs text-forest-600 hover:underline mt-0.5 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
          <input
            value={user?.email ?? ''}
            readOnly
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 select-all cursor-default focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !firstName.trim() || !lastName.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-900 text-white text-sm font-bold hover:bg-forest-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs text-gray-400">
          Your data is processed in accordance with Kenya&apos;s Data Protection Act 2019.
          Email <a href="mailto:support@maschon.co.ke" className="text-forest-600 hover:underline">support@maschon.co.ke</a> to request deletion or export.
        </p>
      </div>
    </div>
  );
}
