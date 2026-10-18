import React from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, User as UserIcon, LogOut, Bell, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, dbUser, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Invest<span className="text-emerald-400">Flow</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Enterprise BPMN & Rules
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/notifications"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors relative"
            title="Notification Center"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-slate-200 flex items-center justify-end gap-1.5">
                  {dbUser?.name || user.name || user.username}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {dbUser?.role || user.role || 'Investor'}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {dbUser?.department?.name ? `Dept: ${dbUser.department.name}` : user.email || user.username}
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                <UserIcon className="w-5 h-5" />
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/50 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

