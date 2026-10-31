import React from 'react';
import { Link } from 'react-router';
import {
  ShieldAlert,
  FileSearch,
  Split,
  FileQuestion,
  Radar,
  BellRing,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Layers,
  Database,
  Server,
  Code2,
} from 'lucide-react';

const NOVELTIES = [
  {
    id: 'n1',
    code: 'N1',
    title: 'Profit-Aware Discount Guardrail',
    path: '/discount-guardrail',
    icon: ShieldAlert,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description:
      'Calculates real-time COGS profit margins during discount authoring and enforces multi-tier management overrides before loss-making deals can be finalized.',
    highlights: ['Real-time Margin Simulator', '15% Threshold Enforcement', 'Director/Manager Escalations', 'Tamper-Evident Audit Log'],
  },
  {
    id: 'n2',
    code: 'N2',
    title: 'Billing Integrity Auditor',
    path: '/integrity-auditor',
    icon: FileSearch,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description:
      'Proactive background reconciliation scanner that uncovers duplicate invoices, orphaned payments, and revenue leaks across databases.',
    highlights: ['Multi-Database Sanity Scanner', 'Severity Categorization (Critical -> Info)', 'One-Click Audit Execution', 'Historic Run Comparisons'],
  },
  {
    id: 'n3',
    code: 'N3',
    title: 'Split-Payment Bank Matcher',
    path: '/bank-matcher',
    icon: Split,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    description:
      'Resolves the NP-hard subset-sum problem to reconcile lump-sum wire deposits that consolidate multiple outstanding customer invoices.',
    highlights: ['Subset-Sum Combinatorial Search', 'Bank Statement CSV Ingestion', 'Confidence Score Calculation', 'Batch Reconciliation Approval'],
  },
  {
    id: 'n4',
    code: 'N4',
    title: 'Bill-Change Explainer',
    path: '/bill-explainer',
    icon: FileQuestion,
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    description:
      'Translates month-over-month invoice variance into natural-language plain-English explanations, detailing plan upgrades, tax revisions, and discounts.',
    highlights: ['Plain-English Delta Engine', 'Item-by-Item Variance Breakdown', 'Visual Variance Tags', 'Zero Support Friction'],
  },
  {
    id: 'n5',
    code: 'N5',
    title: 'Renewal Radar',
    path: '/renewal-radar',
    icon: Radar,
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    description:
      'Visual urgency pipeline categorizing upcoming subscription renewals into 7-day, 30-day, and 60-day horizons with 1-click quotation generation.',
    highlights: ['Urgency-Based Bucketing', '1-Click Quotation Generator', 'Churn Mitigation Workflow', 'Open Quote Tracking'],
  },
  {
    id: 'n6',
    code: 'N6',
    title: 'Automatic Reminder Centre',
    path: '/reminder-centre',
    icon: BellRing,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description:
      'Configurable notification cadence engine automating due-date warnings and overdue escalations with deduplication constraints.',
    highlights: ['Cadence Policy Configuration', 'Automated Daily Dispatch', 'Deduplication Safeguards', 'Upcoming Notification Queue'],
  },
];

export const Overview: React.FC = () => {
  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Brightloop Hackathon Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Independent Novelty Feature Modules
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            All six competitive novelty features (N1–N6) built completely isolated from the main application codebase. Merge-ready with independent FastAPI backends, SQLite data isolation, and comprehensive test suites.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>FastAPI Port 8001</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Isolated SQLite DB</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <span>React 19 + Vite Port 5174</span>
            </div>
          </div>
        </div>
      </div>

      {/* Novelties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {NOVELTIES.map((novelty) => {
          const Icon = novelty.icon;
          return (
            <div
              key={novelty.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${novelty.badgeColor}`}
                  >
                    {novelty.code}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {novelty.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {novelty.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Core Capabilities
                  </span>
                  {novelty.highlights.map((h, i) => (
                    <div key={i} className="text-xs text-slate-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to={novelty.path}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200"
              >
                Launch {novelty.code} Workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
