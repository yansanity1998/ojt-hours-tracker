import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabase';
import { LogOut, Loader2, Lock, Mail, Save, User, Camera } from 'lucide-react';

interface ProfileProps {
    companyName: string;
    companyLocation: string;
    totalRequiredHours: number;
    onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ companyName, companyLocation, totalRequiredHours, onLogout }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);

    const [savingName, setSavingName] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (!error && user) {
                setEmail(user.email ?? '');

                // Fetch from profiles table
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profile) {
                    setFullName(profile.full_name ?? '');
                    setAvatarUrl(profile.avatar_url);
                } else {
                    // Fallback to metadata
                    const metaName = (user.user_metadata as { full_name?: string } | null)?.full_name;
                    if (metaName) {
                        setFullName(metaName);
                    }
                    const metaAvatar = (user.user_metadata as { avatar_url?: string } | null)?.avatar_url;
                    if (metaAvatar) {
                        setAvatarUrl(metaAvatar);
                    }
                }
            }
            setInitialLoading(false);
        };

        loadUser();
    }, []);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage(null);
            setMessageType(null);
        }, 3000);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('No user logged in.');

            const filePath = `${user.id}/${Math.random()}.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update profiles table
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Update auth metadata for faster access elsewhere
            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            setAvatarUrl(publicUrl);
            showMessage('success', 'Profile picture updated!');
        } catch (error: any) {
            showMessage('error', error.message || 'Error uploading avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) {
            showMessage('error', 'Name cannot be empty.');
            return;
        }
        setSavingName(true);
        const { data: { user } } = await supabase.auth.getUser();

        // Update both profiles table and auth metadata
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ full_name: fullName.trim() })
            .eq('id', user?.id);

        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName.trim() },
        });

        setSavingName(false);

        if (error || profileError) {
            showMessage('error', 'Failed to update name.');
        } else {
            showMessage('success', 'Name updated successfully.');
        }
    };

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oldPassword) {
            showMessage('error', 'Please enter your current password.');
            return;
        }
        if (!password || password.length < 6) {
            showMessage('error', 'Password must be at least 6 characters.');
            return;
        }
        if (password !== passwordConfirm) {
            showMessage('error', 'Passwords do not match.');
            return;
        }

        if (!email) {
            showMessage('error', 'Unable to verify current user. Please re-login.');
            return;
        }

        setSavingPassword(true);

        // First, verify the old password by signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: oldPassword,
        });

        if (signInError) {
            setSavingPassword(false);
            showMessage('error', 'Old password is incorrect.');
            return;
        }

        // If old password is correct, update to the new password
        const { error } = await supabase.auth.updateUser({
            password,
        });
        setSavingPassword(false);

        if (error) {
            showMessage('error', 'Failed to update password.');
        } else {
            setOldPassword('');
            setPassword('');
            setPasswordConfirm('');
            showMessage('success', 'Password updated successfully.');
        }
    };

    if (initialLoading) {
        return (
            <div className="card flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#1a2517] animate-spin" />
            </div>
        );
    }

    return (
        <div className="card glass-card space-y-6">
            {message && (
                <div
                    className={`px-4 py-2 rounded-lg text-xs font-semibold text-center ${messageType === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-red-50 text-red-600 border border-red-100'
                        }`}
                >
                    {message}
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold text-[#1a2517] mb-4">Profile</h2>
                <div className="space-y-4">
                    <div className="p-4 bg-white/40 backdrop-blur-sm border border-white/20 rounded-xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative group w-fit shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1a2517]/10 flex items-center justify-center text-[#1a2517] overflow-hidden border-2 border-[#1a2517]/5 group-hover:border-[#ACC8A2] transition-all duration-300 shadow-inner">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <User className="w-10 h-10 opacity-40" />
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
                                            <Loader2 className="w-6 h-6 text-[#1a2517] animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#1a2517] text-white flex items-center justify-center cursor-pointer hover:bg-[#4A5D44] transition-all shadow-lg border-2 border-white group-hover:scale-110">
                                    <Camera className="w-4 h-4" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col items-start ml-1 sm:ml-2">
                                <p className="text-xs font-semibold text-[#1a2517]/60 uppercase tracking-widest mb-1">Account</p>
                                <p className="w-full text-xs sm:text-base font-bold text-[#1a2517] flex items-center gap-2 min-w-0 justify-start">
                                    <Mail className="w-4 h-4 text-[#1a2517]/30 shrink-0" />
                                    <span className="min-w-0 break-all">
                                        {email}
                                    </span>
                                </p>
                                <p className="text-[10px] text-[#1a2517]/50 font-medium">Click the camera to update photo</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveName} className="space-y-2">
                            <label className="text-xs font-semibold text-[#1a2517]/60 uppercase tracking-widest">
                                Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1a2517] focus:outline-none focus:ring-2 focus:ring-[#ACC8A2] bg-white"
                                placeholder="Enter your name"
                            />
                            <button
                                type="submit"
                                disabled={savingName}
                                className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1a2517] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#4A5D44] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            >
                                {savingName ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Save className="w-3.5 h-3.5" />
                                )}
                                <span>{savingName ? 'Saving...' : 'Save Name'}</span>
                            </button>
                        </form>
                    </div>

                    <div className="p-4 bg-white/40 backdrop-blur-sm border border-white/20 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#1a2517]/10 flex items-center justify-center text-[#1a2517]">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-[#1a2517]/60 uppercase tracking-widest">Security</p>
                                <p className="text-sm font-bold text-[#1a2517]">Change Password</p>
                            </div>
                        </div>

                        <form onSubmit={handleSavePassword} className="space-y-2">
                            <label className="text-xs font-semibold text-[#1a2517]/60 uppercase tracking-widest">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1a2517] focus:outline-none focus:ring-2 focus:ring-[#ACC8A2] bg-white"
                                placeholder="Enter current password"
                            />
                            <label className="text-xs font-semibold text-[#1a2517]/60 uppercase tracking-widest">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1a2517] focus:outline-none focus:ring-2 focus:ring-[#ACC8A2] bg-white"
                                placeholder="Enter new password"
                            />
                            <label className="text-xs font-semibold text-[#1a2517]/60 uppercase tracking-widest">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1a2517] focus:outline-none focus:ring-2 focus:ring-[#ACC8A2] bg-white"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1a2517] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#4A5D44] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            >
                                {savingPassword ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Save className="w-3.5 h-3.5" />
                                )}
                                <span>{savingPassword ? 'Saving...' : 'Save Password'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-[#1a2517] mb-4">OJT Settings</h2>
                <div className="space-y-4">
                    <div className="p-4 bg-white/40 backdrop-blur-sm border border-white/20 rounded-xl">
                        <p className="text-sm text-[#1a2517]/70 mb-1">Company</p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-[#1a2517]">{companyName}</p>
                            {companyLocation && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyLocation)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-black text-[#1a2517] bg-[#1a2517]/10 px-2 py-1 rounded-lg uppercase tracking-wider hover:bg-[#1a2517]/20 transition-all"
                                >
                                    View Map
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-white/40 backdrop-blur-sm border border-white/20 rounded-xl">
                        <p className="text-sm text-[#1a2517]/70 mb-1">Location</p>
                        <p className="text-sm font-medium text-[#1a2517] opacity-70 italic">
                            {companyLocation || 'No location set'}
                        </p>
                    </div>
                    <div className="p-4 bg-white/40 backdrop-blur-sm border border-white/20 rounded-xl">
                        <p className="text-sm text-[#1a2517]/70 mb-1">Total Hours Required</p>
                        <p className="text-lg font-bold text-[#1a2517]">{totalRequiredHours} hours</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#1a2517] to-[#ACC8A2] rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;