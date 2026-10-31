import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  LayoutDashboard,
  ShieldAlert,
  FileSearch,
  Split,
  FileQuestion,
  Radar,
  BellRing,
  Sparkles,
  Server,
  UserCheck,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import type { UserRole } from '@/types';

const NAV_ITEMS = [
  { path: '/', label: 'Overview & Architecture', icon: LayoutDashboard, tag: 'Hub' },
  { path: '/discount-guardrail', label: 'Discount Guardrail', icon: ShieldAlert, tag: 'N1' },
  { path: '/integrity-auditor', label: 'Integrity Auditor', icon: FileSearch, tag: 'N2' },
  { path: '/bank-matcher', label: 'Bank Matcher', icon: Split, tag: 'N3' },
  { path: '/bill-explainer', label: 'Bill Explainer', icon: FileQuestion, tag: 'N4' },
  { path: '/renewal-radar', label: 'Renewal Radar', icon: Radar, tag: 'N5' },
  { path: '/reminder-centre', label: 'Reminder Centre', icon: BellRing, tag: 'N6' },
];

export const Layout: React.FC = () => {
  const [role, setRole] = useState<UserRole>('admin');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 text-slate-300 z-50 flex flex-col justify-between border-r border-slate-800 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Logo & Branding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-base tracking-tight block">
                  Brightloop
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 block">
                  Novelty Lab
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Competitive Novelties
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.tag}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Isolation Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Port 8001 Live
            </span>
            <span className="text-[10px] text-slate-500">v1.0.0</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            Zero changes to main app • Standalone build ready to merge
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <Server className="w-4 h-4 text-slate-400" />
            <span>Target:</span>
            <code className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
              /api/novelties/
            </code>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Role Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">Role:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="admin">Administrator</option>
                <option value="staff">Sales Staff</option>
                <option value="customer">Customer Portal</option>
              </select>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
