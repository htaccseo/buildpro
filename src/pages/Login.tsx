import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { LayoutDashboard } from 'lucide-react';
import type { UserRole } from '../lib/types';

export function Login({ initialMode = 'login' }: { initialMode?: 'login' | 'signup' }) {
    const navigate = useNavigate();
    const { login, signup } = useStore();

    // URL Params for Invite Flow
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const inviteOrgId = searchParams.get('orgId');
    const inviteOrgName = searchParams.get('orgName');
    const inviteEmail = searchParams.get('email');
    const inviteRole = searchParams.get('role') as UserRole;

    // Redirect if already logged in (SKIP if accepting invite)
    const { currentUser } = useStore();
    React.useEffect(() => {
        if (currentUser && !inviteOrgId) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate, inviteOrgId]);

    // Login State
    const [email, setEmail] = useState('john@meits.com');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState<string | null>(null);

    // Sign Up State
    const [name, setName] = useState('');
    const [signupEmail, setSignupEmail] = useState(inviteEmail || '');
    const [signupPassword, setSignupPassword] = useState('');
    const [phone, setPhone] = useState('');
    // For invites, company field is organizationId, but display logic might want name.
    // However, signup expects 'company' as string.
    // If inviting, we set organizationId explicitly.
    const [company, setCompany] = useState(inviteOrgName || '');
    const [role, setRole] = useState<UserRole>(inviteRole || 'builder');

    // Auto-switch to signup if invite present or initialMode is signup
    const [isSignUp, setIsSignUp] = useState(!!inviteOrgId || initialMode === 'signup');

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                await signup({
                    name,
                    email: signupEmail,
                    password: signupPassword,
                    phone,
                    company, // Pass actual company name instead of replacing with 'Hidden'
                    role,
                    organizationName: company,
                    organizationId: inviteOrgId || undefined
                });

                // Check if signup succeeded (user should be set in store)
                const state = useStore.getState();
                if (state.currentUser) {
                    localStorage.setItem('meits_user_email', signupEmail);
                    navigate('/dashboard');
                } else {
                    setError(state.error || 'Signup failed. Please try again.');
                }
            } else {
                await login(email);

                // Check if login succeeded
                const state = useStore.getState();
                if (state.currentUser) {
                    localStorage.setItem('meits_user_email', email);
                    navigate('/dashboard');
                } else {
                    setError(state.error || 'Login failed. Please check your credentials.');
                }
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-app flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                        <LayoutDashboard className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-navy-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
                    <p className="text-text-muted mt-2">{isSignUp ? 'Join meits to manage your projects' : 'Sign in to your meits account'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {isSignUp && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-navy-900"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1.5">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-navy-900"
                                    placeholder="0400 000 000"
                                    required
                                />
                            </div>
                            {!inviteOrgId && (
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Company Name</label>
                                    <input
                                        type="text"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        className="w-full px-4 py-3 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-navy-900"
                                        placeholder="Acme Construction"
                                        required
                                    />
                                </div>
                            )}
                            {inviteOrgId && (
                                <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-full border border-emerald-100 flex items-center gap-2">
                                    <span className="font-bold">Joining Team</span>
                                    {inviteOrgName ? (
                                        <span className="text-emerald-600 font-medium ml-auto text-right">{inviteOrgName}</span>
                                    ) : (
                                        <span className="text-emerald-600 text-xs ml-auto">(Organization Applied)</span>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Email Address</label>
                        <input
                            type="email"
                            value={isSignUp ? signupEmail : email}
                            onChange={(e) => isSignUp ? setSignupEmail(e.target.value) : setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-navy-900"
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Password</label>
                        <input
                            type="password"
                            value={isSignUp ? signupPassword : password}
                            onChange={(e) => isSignUp ? setSignupPassword(e.target.value) : setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-navy-900"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1.5">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="w-full px-4 py-3 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-navy-900 appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={!!inviteRole}
                            >
                                <option value="builder">Builder / Manager</option>
                                <option value="worker">Worker</option>
                                <option value="admin">Admin</option>
                                <option value="carpenter">Carpenter</option>
                                <option value="planner">Planner</option>
                                <option value="architect">Architect</option>
                                <option value="electrician">Electrician</option>
                                <option value="plumber">Plumber</option>
                                <option value="painter">Painter</option>
                                <option value="tiler">Tiler</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-full transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-70 flex items-center justify-center mt-6"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            isSignUp ? 'Create Account' : 'Sign In'
                        )}
                    </button>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                        >
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>

                    {!isSignUp && (
                        <div className="text-center">
                            <a href="#" className="text-sm text-slate-400 hover:text-navy-900 transition-colors">
                                Forgot your password?
                            </a>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
