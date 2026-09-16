import { useState, type FormEvent } from 'react';
import { Lock, Mail, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLogin() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
    }
    setLoading(false);
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: resetError } = await resetPassword(email);
    setLoading(false);

    if (resetError) {
      setError(resetError);
    } else {
      setResetSent(true);
    }
  };

  const inputClasses =
    'w-full rounded-lg border border-white/10 bg-charcoal-800 px-4 py-3.5 text-sm text-white placeholder-aluminum-400 transition-colors focus:border-ice-400 focus:outline-none focus:ring-1 focus:ring-ice-400';

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-6">
      <div className="w-full max-w-md">
        <a
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-aluminum-400 transition-colors hover:text-ice-300"
        >
          <ArrowLeft size={16} />
          Back to website
        </a>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-aluminum-300 via-aluminum-100 to-aluminum-400 shadow-md">
            <span className="text-base font-bold text-charcoal-900">DM</span>
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-wide text-white">
              DM ALUMINIUM
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ice-300">
              &amp; Glass — Admin
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-charcoal-800/50 p-8">
          {resetMode ? (
            resetSent ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ice-500/15 ring-1 ring-ice-400/30">
                  <Mail size={28} className="text-ice-300" />
                </div>

                <h2 className="text-lg font-semibold text-white">
                  Check Your Email
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-aluminum-300">
                  If an account exists for that email, a password reset link
                  has been sent.
                </p>

                <button
                  onClick={() => {
                    setResetMode(false);
                    setResetSent(false);
                  }}
                  className="mt-6 rounded-md border border-aluminum-400/30 px-5 py-2.5 text-sm font-semibold text-aluminum-100 transition-colors hover:border-ice-300/50 hover:text-white"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Reset Password
                  </h2>

                  <p className="mt-2 text-sm text-aluminum-300">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-aluminum-300">
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aluminum-500"
                    />

                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@email.com"
                      className={`${inputClasses} pl-11`}
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-ice-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-ice-500/20 transition-all hover:bg-ice-400 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setResetMode(false)}
                  className="w-full text-center text-sm text-aluminum-400 transition-colors hover:text-ice-300"
                >
                  Back to Login
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck size={20} className="text-ice-300" />

                <h2 className="text-lg font-semibold text-white">
                  Admin Sign In
                </h2>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-aluminum-300">
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aluminum-500"
                  />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@email.com"
                    className={`${inputClasses} pl-11`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-aluminum-300">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aluminum-500"
                  />

                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClasses} pl-11`}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-ice-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-ice-500/20 transition-all hover:bg-ice-400 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>

              <button
                type="button"
                onClick={() => setResetMode(true)}
                className="w-full text-center text-sm text-aluminum-400 transition-colors hover:text-ice-300"
              >
                Forgot password?
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}