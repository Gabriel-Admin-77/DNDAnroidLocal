'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const error = searchParams.get('error');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(error ? decodeURIComponent(error) : '');
    const supabase = createClient();

    const handleAuth = async (action: 'login' | 'signup') => {
        setErrorMsg('');

        if (!email || !password) {
            setErrorMsg('Email and password are required.');
            return;
        }
        if (!email.includes('@') || !email.includes('.')) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            if (action === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    setErrorMsg(error.message);
                } else {
                    router.push('/champions');
                }
            } else {
                const { error, data } = await supabase.auth.signUp({ email, password });
                if (error) {
                    setErrorMsg(error.message);
                } else {
                    if (data.user) {
                        const username = email.split('@')[0];
                        await supabase.from('profiles').insert([{ id: data.user.id, username }]);
                    }
                    router.push('/champions');
                }
            }
        } catch {
            setErrorMsg('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-stone-900/80 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-stone-800">
            {errorMsg && (
                <div className="mb-6 p-4 bg-crimson-950/30 border border-crimson-500/50 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 text-crimson-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-crimson-200">{errorMsg}</p>
                </div>
            )}

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-stone-300">Email address</label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none block w-full px-3 py-3 bg-stone-950 border border-stone-700 rounded-md shadow-sm placeholder-stone-500 text-stone-200 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-stone-300">Password</label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none block w-full px-3 py-3 bg-stone-950 border border-stone-700 rounded-md shadow-sm placeholder-stone-500 text-stone-200 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={() => handleAuth('login')}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-stone-800 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-colors border-stone-700 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Sign In
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleAuth('signup')}
                        className="w-full flex justify-center items-center py-3 px-4 border border-gold-500/50 rounded-md shadow-[0_0_10px_rgba(245,158,11,0.1)] text-sm font-medium text-gold-400 bg-stone-950 hover:bg-stone-900 hover:text-gold-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Sign Up
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-crimson-900/10 rounded-full blur-[120px]" />
                <div className="absolute top-[60%] right-[0%] w-[30%] h-[30%] bg-gold-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
                <h2 className="mt-6 text-center text-4xl font-extrabold text-stone-100 font-serif">Aide-de-Camp</h2>
                <p className="mt-2 text-center text-sm text-stone-400">Sign in to access your campaigns and champions</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
                <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-stone-500" /></div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
