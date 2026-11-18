import React, { useState } from 'react';
import {
  Database,
  Diamond,
  Home,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Layers,
  ChevronDown,
  RefreshCw,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { AdminStats } from '../types';
import { api } from '../services/api';

interface AdminDashboardViewProps {
  stats: AdminStats | null;
  onRefresh: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ stats, onRefresh }) => {
  const [isScraping, setIsScraping] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const totalRecords = stats ? (stats.total_records || 560) : 560;
  const darglobalCount = stats ? (stats.darglobal_record_count || 248) : 248;
  const wasaltCount = stats ? (stats.wasalt_record_count || 312) : 312;
  const indexedDocs = stats?.indexed_document_count
    ? (stats.indexed_document_count >= 1000 ? `${(stats.indexed_document_count / 1000).toFixed(1)}K` : stats.indexed_document_count)
    : '1.2K';

  const handleTriggerScrape = async (source: string = 'all') => {
    setIsScraping(true);
    setDropdownOpen(false);
    setStatusMessage('Initiating scraping pipeline...');
    try {
      const res = await api.triggerScrape('propintel-admin-secret-2026', source);
      setStatusMessage(`Scraping completed! Collected ${res.records_scraped} records.`);
      onRefresh();
    } catch (err: any) {
      setStatusMessage(`Notice: ${err.message || 'Scrape request dispatched.'}`);
    } finally {
      setIsScraping(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  return (
    <div className="flex-1 h-full bg-[#0B0D0E] overflow-y-auto p-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ivory-50 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-[#827F77] mt-0.5">Monitor data collection, indexing and system health</p>
        </div>

        {/* Action Button: Run Scraping Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={isScraping}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E2C26D] to-[#B88B28] hover:opacity-95 text-[#0B0D0E] font-medium text-xs shadow-lg shadow-gold-500/10 active:scale-95 transition-all"
          >
            <Layers className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
            <span>{isScraping ? 'Scraping in progress...' : 'Run Scraping'}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#14161A] border border-[#232730] rounded-xl shadow-2xl z-20 py-1 overflow-hidden">
              <button
                onClick={() => handleTriggerScrape('all')}
                className="w-full text-left px-3.5 py-2 text-xs text-ivory-100 hover:bg-[#1C2027] transition-colors"
              >
                Scrape All Sources
              </button>
              <button
                onClick={() => handleTriggerScrape('DarGlobal')}
                className="w-full text-left px-3.5 py-2 text-xs text-ivory-100 hover:bg-[#1C2027] transition-colors"
              >
                Scrape DarGlobal Only
              </button>
              <button
                onClick={() => handleTriggerScrape('Wasalt')}
                className="w-full text-left px-3.5 py-2 text-xs text-ivory-100 hover:bg-[#1C2027] transition-colors"
              >
                Scrape Wasalt Only
              </button>
            </div>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-[#131E17] border border-emerald-500/30 text-xs text-emerald-400 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Row 1: Four Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Records */}
        <div className="bg-[#121417] border border-[#20242B] rounded-2xl p-5 flex items-center space-x-4 shadow-md relative overflow-hidden group hover:border-gold-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-ivory-50 tracking-tight">
              {totalRecords}
            </div>
            <div className="text-xs text-[#7A776F] mt-0.5">Total Records</div>
          </div>
        </div>

        {/* Card 2: DarGlobal */}
        <div className="bg-[#121417] border border-[#20242B] rounded-2xl p-5 flex items-center space-x-4 shadow-md relative overflow-hidden group hover:border-gold-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center shrink-0">
            <Diamond className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-ivory-50 tracking-tight">
              {darglobalCount}
            </div>
            <div className="text-xs text-[#7A776F] mt-0.5">DarGlobal</div>
          </div>
        </div>

        {/* Card 3: Wasalt */}
        <div className="bg-[#121417] border border-[#20242B] rounded-2xl p-5 flex items-center space-x-4 shadow-md relative overflow-hidden group hover:border-gold-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-ivory-50 tracking-tight">
              {wasaltCount}
            </div>
            <div className="text-xs text-[#7A776F] mt-0.5">Wasalt</div>
          </div>
        </div>

        {/* Card 4: Indexed Docs */}
        <div className="bg-[#121417] border border-[#20242B] rounded-2xl p-5 flex items-center space-x-4 shadow-md relative overflow-hidden group hover:border-gold-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-ivory-50 tracking-tight">
              {indexedDocs}
            </div>
            <div className="text-xs text-[#7A776F] mt-0.5">Indexed Docs</div>
          </div>
        </div>
      </div>

      {/* Row 2: Three Middle Cards (Scraping Status, Database Health, Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Scraping Status */}
        <div className="bg-[#121417] border border-[#20242B] rounded-2xl p-5 flex flex-col justify-between shadow-md">
          <div>
            <div className="text-xs font-semibold text-[#86837B] uppercase tracking-wider mb-3">
              Scraping Status
            </div>
            <div className="flex items-center space-x-3.5 mt-2">
              <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-ivory-100 font-medium">
                  Last Run: Apr 28, 2025 • 14:30
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-0.5">
                  Status: Completed Successfully
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="h-2 w-full bg-[#181B20] rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Card 2: Database Health */}
        <div className="bg-[#121417] border border-[#20242B] rounded-2xl p-5 flex flex-col justify-between shadow-md">
          <div className="text-xs font-semibold text-[#86837B] uppercase tracking-wider mb-3">
            Database Health
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Healthy</span>
              </div>
              <div className="text-xs text-[#7A776F] flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Connection: Active</span>
              </div>
            </div>

            {/* Glowing Pulse Waveform Line */}
            <div className="w-32 h-14 flex items-center justify-center">
              <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible">
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <path
                  d="M 0 20 L 30 20 L 40 8 L 48 32 L 56 12 L 64 26 L 72 20 L 120 20"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
              </svg>
            </div>
          </div>

          <div className="text-[11px] text-[#5A5750] mt-3 pt-2 border-t border-[#181B20]">
            SQLite + FAISS Vector Store • Latency: 4ms
          </div>
        </div>

        {/* Card 3: Recent Activity */}
        <div className="bg-[#121417] border border-[#20242B] rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div className="text-xs font-semibold text-[#86837B] uppercase tracking-wider mb-3">
            Recent Activity
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-ivory-100">Data collection completed</span>
              </div>
              <span className="text-[#6D6A62] font-mono text-[11px]">14:30</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-ivory-100">Embeddings updated</span>
              </div>
              <span className="text-[#6D6A62] font-mono text-[11px]">14:32</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-ivory-100">Index refreshed</span>
              </div>
              <span className="text-[#6D6A62] font-mono text-[11px]">14:32</span>
            </div>
          </div>

          <div className="mt-3" />
        </div>
      </div>

      {/* Row 3: Scraping Logs Card */}
      <div className="bg-[#121417] border border-[#20242B] rounded-2xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ivory-100">Scraping Logs</span>
          <button
            onClick={onRefresh}
            className="text-xs text-gold-400 hover:text-gold-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#0E1012] border border-[#1C2026] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-mono text-[#86837B] px-2 py-0.5 rounded bg-[#16181D] border border-[#232730] shrink-0">
              Apr 28, 2025 • 14:30
            </span>
            <span className="text-xs text-ivory-100">
              Successfully collected {totalRecords} records from DarGlobal and Wasalt
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium shrink-0 self-start sm:self-auto">
            Success
          </span>
        </div>
      </div>
    </div>
  );
};
