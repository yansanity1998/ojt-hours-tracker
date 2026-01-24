
import React, { useState, useEffect, useRef } from 'react';
import mainImage from '../../assets/image/calendar.jpg';
import internImage from '../../assets/image/intern.jpg';
import { User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabase';
import Toast from '../UI/Toast';
import type { Session } from '@supabase/supabase-js';

interface RegisterProps {
    session?: Session | null;
}

const Register: React.FC<RegisterProps> = ({ session }) => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [justRegistered, setJustRegistered] = useState(false);
    const isSubmittingRef = useRef(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Trigger animations after component mounts
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Redirect if already logged in and NOT just registered (and not currently submitting)
    useEffect(() => {
        if (session && !justRegistered && !showToast && !isSubmittingRef.current) {
            navigate('/', { replace: true });
        }
    }, [session, justRegistered, showToast, navigate]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        isSubmittingRef.current = true;

        try {
            const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        name: name.trim(),
                    },
                },
            });

            if (error) throw error;

            // Registration successful
            setJustRegistered(true);
            setShowToast(true);
            // Keep isSubmittingRef true so we don't auto-redirect via useEffect while toast is showing

            // Sign out the user
            await supabase.auth.signOut();

            // Delay redirect to show toast
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'An error occurred during registration');
            isSubmittingRef.current = false; // Reset on error so standard auth checks resume
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

            <Toast
                message="Account successfully created! Redirecting..."
                type="success"
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />

            <div className="w-full max-w-md rounded-none sm:rounded-3xl overflow-hidden flex flex-col justify-center py-8 sm:py-10 z-10">

                {/* Header Section with Image - slightly smaller on register to fit fields */}
                <div className="flex flex-col items-center pt-8 pb-4 px-8">
                    {/* Logo with fade-in and scale animation */}
                    <div
                        className={`w-40 h-40 md:w-56 md:h-56 mb-2 relative rounded-full overflow-hidden ${isLoaded ? 'animate-roll-in' : 'opacity-0'
                            }`}
                        style={{ transitionDelay: '100ms' }}
                    >
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
                        Join OJTHub
                    </h1>

                    {/* Subtitle with fade-in and slide-up animation */}
                    <p
                        className={`text-gray-100 text-sm font-medium text-center transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                        style={{ transitionDelay: '400ms' }}
                    >
                        Start tracking your journey today
                    </p>
                </div>

                {/* Register Form */}
                <div
                    className={`px-8 pb-6 transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                        }`}
                    style={{ transitionDelay: '550ms' }}
                >
                    <form className="space-y-4" onSubmit={handleRegister}>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm border border-red-100">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-gray-100 ml-1">Full Name</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    id="name"
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-700 placeholder-gray-400 group-hover:bg-white"
                                />
                                <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary" />
                            </div>
                        </div>

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
                            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-100 ml-1">Password</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-700 placeholder-gray-400 group-hover:bg-white"
                                />
                                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary" />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#1a2517] hover:bg-[#0f160e] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#1a2517]/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>
                    </form>

                    {/* Footer / Login Link */}
                    <div
                        className={`mt-4 pt-4 border-t border-white/30 flex flex-col items-center gap-3 transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                        style={{ transitionDelay: '700ms' }}
                    >
                        <p className="text-gray-100 text-sm">Already have an account?</p>
                        <Link to="/login" className="w-full text-center py-3 rounded-xl border-2 border-white text-white font-bold hover:bg-white/10 hover:border-white hover:shadow-lg hover:shadow-white/20 transition-all duration-300 active:scale-[0.96]">
                            I already have an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
