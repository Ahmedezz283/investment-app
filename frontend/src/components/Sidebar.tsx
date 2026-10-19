import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Users,
  BellRing,
  Cpu,
  FileText,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Investment Requests', href: '/investments', icon: FolderKanban },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Users & Roles', href: '/users', icon: Users },
  { name: 'Kafka Notifications', href: '/notifications', icon: BellRing },
];

const engineNavigation = [
  { name: 'GoRules Engine', href: '/gorules', icon: Cpu },
  { name: 'Jasper Reports', href: '/jasper', icon: FileText },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 flex-shrink-0 hidden md:block border-r border-slate-800/80 bg-slate-950/40 p-4 overflow-y-auto">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Engine Integrations nav links */}
      <div className="mt-8 space-y-1">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Engine Integrations
        </div>
        {engineNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-950/50'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Status indicators */}
      <div className="mt-8 pt-6 border-t border-slate-800/60">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Flowable BPMN
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              GoRules Engine
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Kafka Consumer
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">READY</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Jasper Reports
            </span>
            <span className="text-[10px] text-amber-400 font-mono">ACTIVE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
