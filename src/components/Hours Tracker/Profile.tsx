    import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabase';
import { LogOut, Loader2, Lock, Mail, Save, User } from 'lucide-react';

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

    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            if (!error && data.user) {
                setEmail(data.user.email ?? '');
                const metaName = (data.user.user_metadata as { full_name?: string } | null)?.full_name;
                if (metaName) {
                    setFullName(metaName);
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

    const handleSaveName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) {
            showMessage('error', 'Name cannot be empty.');
            return;
        }
        setSavingName(true);
        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName.trim() },
        });
        setSavingName(false);

        if (error) {
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
        <div className="card space-y-6">
            {message && (
                <div
                    className={`px-4 py-2 rounded-lg text-xs font-semibold text-center ${
                        messageType === 'success'
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
                    <div className="p-4 bg-gradient-to-br from-[#1a2517]/5 to-[#ACC8A2]/5 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#1a2517]/10 flex items-center justify-center text-[#1a2517]">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-[#1a2517]/60 uppercase tracking-widest">Account</p>
                                <p className="text-sm font-bold text-[#1a2517] flex items-center gap-2">
                                    {email}
                                    <Mail className="w-3.5 h-3.5 text-[#1a2517]/50" />
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveName} className="space-y-2">
                            <label className="text-xs font-semibold text-[#1a2517]/60 uppercase tracking-widest">
                                Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
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

                    <div className="p-4 bg-gradient-to-br from-[#1a2517]/5 to-[#ACC8A2]/5 rounded-xl">
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
                    <div className="p-4 bg-gradient-to-br from-[#1a2517]/5 to-[#ACC8A2]/5 rounded-xl">
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
                    <div className="p-4 bg-gradient-to-br from-[#1a2517]/5 to-[#ACC8A2]/5 rounded-xl">
                        <p className="text-sm text-[#1a2517]/70 mb-1">Location</p>
                        <p className="text-sm font-medium text-[#1a2517] opacity-70 italic">
                            {companyLocation || 'No location set'}
                        </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#1a2517]/5 to-[#ACC8A2]/5 rounded-xl">
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