import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { TrendingUp, KeyRound, User, Lock, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { Modal } from '../components/Modal';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ username, password });
      navigate('/');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Failed to sign in. Please verify your credentials with Keycloak.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setForgotLoading(true);

    try {
      await authApi.forgetPassword(forgotEmail);
      setForgotSuccess('A password reset link has been sent to your email.');
    } catch (err: any) {
      setForgotError(err?.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-950/60 mb-4">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Sign in to InvestFlow
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Enterprise BPMN & Risk Approval Engine
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or investor1"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg shadow-emerald-950/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>

      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Your Password"
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <p className="text-sm text-slate-300">
            Enter your email address and Keycloak will dispatch a password reset link.
          </p>
          {forgotSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {forgotSuccess}
            </div>
          )}
          {forgotError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              {forgotError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="investor@example.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={forgotLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
            >
              {forgotLoading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

