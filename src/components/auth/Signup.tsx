import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, X, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { AuthErrorNotice } from './AuthErrorNotice';

interface SignupProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
  onExploreDemo: () => void;
  onExit?: () => void;
}

export const Signup: React.FC<SignupProps> = ({
  onSuccess,
  onNavigateToLogin,
  onExploreDemo,
  onExit,
}) => {
  const { signup, loginWithGoogle, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await signup(fullName, email, password);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Failed to create your account.');
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    const res = await loginWithGoogle();
    if (res.success) {
      onSuccess();
    } else if (!res.cancelled) {
      setError(res.error || 'Google sign-up failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Exit / Cancel Button */}
      {onExit && (
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Home</span>
          </button>
        </div>
      )}

      {onExit && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <button
            type="button"
            onClick={onExit}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer flex items-center justify-center"
            title="Exit / Close"
            aria-label="Exit to home"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <div className="mb-4 flex justify-center">
          <MarketMateLogo size="xl" showSubtitle={true} />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
          Create your MarketMate account
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          Join thousands of Nigerian merchants taking charge of their profit.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:px-10 transition-colors">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <AuthErrorNotice error={error} onClear={() => setError(null)} />}

            <Input
              label="Your Full Name"
              type="text"
              placeholder="e.g. Chukwuemeka Obi"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              leftAddon={<User className="w-4 h-4" />}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. emeka@business.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftAddon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Create Password (min. 6 chars)"
              type="password"
              showPasswordToggle
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftAddon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-start gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Free tier includes unlimited offline recording, POS register, and multi-device sync.</span>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
              className="mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Get Started Free
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 dark:text-slate-500 font-semibold">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Sign in here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
