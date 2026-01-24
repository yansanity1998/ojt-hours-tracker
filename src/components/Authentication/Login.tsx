import React, { useState, useEffect } from 'react';
import mainImage from '../../assets/image/calendar.jpg';
import internImage from '../../assets/image/intern.jpg';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase/supabase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Trigger animations after component mounts
        const timer = setTimeout(() => setIsLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (error) throw error;
            // Navigation is handled by App.tsx detecting session change
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-0 sm:p-6 font-sans text-white relative overflow-hidden">
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${internImage})`,
                    filter: 'blur(2px) brightness(0.8)',
                    transform: 'scale(1.1)', // To avoid blurred edges
                }}
            />
            {/* Dark Green Overlay */}
            <div className="absolute inset-0 z-0 bg-[#4b5d2a]/70" />

            <div className="w-full max-w-md rounded-none sm:rounded-3xl overflow-hidden flex flex-col justify-center py-8 sm:py-10 z-10">

                {/* Header Section with Image */}
                <div className="flex flex-col items-center pt-8 pb-4 px-8">
                    {/* Logo with fade-in and scale animation */}
                    <div
                        className={`w-40 h-40 md:w-56 md:h-56 mb-2 relative rounded-full overflow-hidden ${isLoaded ? 'animate-roll-in' : 'opacity-0'
                            }`}
                        style={{ transitionDelay: '100ms' }}
                    >
                        {/* Using the user provided image as a logo/hero element */}
                        <img
                            src={mainImage}
                            alt="OJTHub Logo"
                            className="w-full h-full object-cover rounded-full transition-transform duration-500 hover:scale-110"
                        />
                    </div>

                    {/* Title with fade-in and slide-up animation */}
                    <h1
                        className={`text-3xl font-extrabold text-white tracking-tight mb-1 transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                        style={{ transitionDelay: '250ms' }}
                    >
                        OJTHub
                    </h1>

                    {/* Subtitle with fade-in and slide-up animation */}
                    <p
                        className={`text-gray-100 text-sm font-medium text-center max-w-[80%] transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                        style={{ transitionDelay: '400ms' }}
                    >
                        Streamline your On-the-Job Training tracking
                    </p>
                </div>

                {/* Login Form */}
                <div
                    className={`px-8 pb-6 transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                        }`}
                    style={{ transitionDelay: '550ms' }}
                >
                    <form className="space-y-4" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm border border-red-100">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-100 ml-1">Email Address</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="email@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-700 placeholder-gray-400 group-hover:bg-white"
                                />
                                <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end ml-1">
                                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-100">Password</label>
                                <a href="#" className="text-xs text-gray-100 font-semibold hover:text-white transition-colors">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-700 placeholder-gray-400 group-hover:bg-white"
                                />
                                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1a2517] hover:bg-[#0f160e] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#1a2517]/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Log In'}
                            {!loading && <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div
                        className={`my-4 flex items-center gap-4 transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                        style={{ transitionDelay: '700ms' }}
                    >
                        <div className="h-px bg-white/30 flex-1" />
                        <span className="text-gray-100 text-sm font-medium">or</span>
                        <div className="h-px bg-white/30 flex-1" />
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: window.location.origin,
                                        queryParams: {
                                            access_type: 'offline',
                                            prompt: 'consent select_account',
                                        },
                                    },
                                });
                                if (error) throw error;
                            } catch (err: any) {
                                setError(err.message || 'An error occurred during Google login');
                            }
                        }}
                        className={`w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md active:scale-[0.96] transition-all duration-300 flex items-center justify-center gap-3 group transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                        style={{ transitionDelay: '850ms' }}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span>Sign in with Google</span>
                    </button>

                    {/* Footer / Register Link */}
                    <div
                        className={`mt-4 pt-4 border-t border-white/30 flex flex-col items-center gap-3 transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                        style={{ transitionDelay: '1000ms' }}
                    >
                        <p className="text-gray-100 text-sm">Don't have an account yet?</p>
                        <Link to="/register" className="w-full text-center py-3 rounded-xl border-2 border-white text-white font-bold hover:bg-white/10 hover:border-white hover:shadow-lg hover:shadow-white/20 transition-all duration-300 active:scale-[0.96]">
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
