import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { MarketMateLogo } from '../common/MarketMateLogo';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  onExit?: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin, onExit }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    const res = await resetPassword(email);
    setIsSubmitting(false);
    setSuccessMessage(res.message);
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
          Reset your password
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          Enter your registered email address to receive reset instructions.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:px-10 transition-colors">
          {successMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{successMessage}</p>
              <Button onClick={onBackToLogin} fullWidth variant="outline">
                Back to Login
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. adaeze@business.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftAddon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                fullWidth
                isLoading={isSubmitting}
                size="lg"
                className="mt-2"
              >
                Send Reset Instructions
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
