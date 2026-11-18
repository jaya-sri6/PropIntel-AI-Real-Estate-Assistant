import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, RefreshCw, CheckCircle, AlertTriangle, Database, Layers, Clock } from 'lucide-react';
import { AdminStats } from '../types';
import { api } from '../services/api';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrapeSuccess: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onScrapeSuccess
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [adminKey, setAdminKey] = useState('propintel-admin-secret-2026');
  const [sourceToScrape, setSourceToScrape] = useState('all');
  const [isScraping, setIsScraping] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const data = await api.fetchStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerScrape = async () => {
    if (!adminKey.trim()) {
      setMessage({ text: 'Please enter the admin secret key.', type: 'error' });
      return;
    }
    setIsScraping(true);
    setMessage(null);
    try {
      const job = await api.triggerScrape(adminKey, sourceToScrape);
      setMessage({
        text: `Scraping job completed! Collected/updated records: ${job.records_scraped}. Status: ${job.status}`,
        type: 'success'
      });
      await loadStats();
      onScrapeSuccess();
    } catch (err: any) {
      setMessage({ text: err.message || 'Scraping failed.', type: 'error' });
    } finally {
      setIsScraping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-[#101215] border border-[#22262E] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#1A1D22] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-ivory-50">Admin Scraping & Pipeline Dashboard</h2>
              <p className="text-xs text-[#827F77]">Manage extraction pipelines, vector indexing, and scraping jobs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#171A1F] hover:bg-[#20242B] text-[#9A968C] hover:text-ivory-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#15171C] border border-[#232730]">
              <div className="text-[11px] text-[#716E66] font-medium flex items-center gap-1">
                <Database className="w-3 h-3 text-gold-400" />
                <span>Total Records</span>
              </div>
              <div className="text-2xl font-bold font-serif text-ivory-100 mt-1">
                {stats?.total_records ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#15171C] border border-[#232730]">
              <div className="text-[11px] text-[#716E66] font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gold-400"></span>
                <span>DarGlobal Records</span>
              </div>
              <div className="text-2xl font-bold font-serif text-ivory-100 mt-1">
                {stats?.darglobal_record_count ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#15171C] border border-[#232730]">
              <div className="text-[11px] text-[#716E66] font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Wasalt Records</span>
              </div>
              <div className="text-2xl font-bold font-serif text-ivory-100 mt-1">
                {stats?.wasalt_record_count ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#15171C] border border-[#232730]">
              <div className="text-[11px] text-[#716E66] font-medium flex items-center gap-1">
                <Layers className="w-3 h-3 text-gold-400" />
                <span>Indexed Chunks</span>
              </div>
              <div className="text-2xl font-bold font-serif text-ivory-100 mt-1">
                {stats?.indexed_chunks_count ?? 0}
              </div>
            </div>
          </div>

          {/* Scrape Controls Card */}
          <div className="p-5 rounded-2xl bg-[#14161A] border border-[#20242B] space-y-4">
            <h3 className="text-sm font-semibold text-ivory-100 flex items-center gap-1.5">
              <span>Trigger Scraping Pipeline (POST /api/admin/scrape)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#8E8B82] mb-1.5">Admin Secret Key (X-Admin-Key)</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin secret key"
                  className="w-full bg-[#181B20] border border-[#272C35] rounded-xl px-3 py-2 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8E8B82] mb-1.5">Target Data Source</label>
                <select
                  value={sourceToScrape}
                  onChange={(e) => setSourceToScrape(e.target.value)}
                  className="w-full bg-[#181B20] border border-[#272C35] rounded-xl px-3 py-2 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
                >
                  <option value="all">Both Sources (DarGlobal & Wasalt)</option>
                  <option value="DarGlobal">DarGlobal Only</option>
                  <option value="Wasalt">Wasalt Only</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="text-[11px] text-[#716E66] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Last Job Status: <strong className="text-gold-400">{stats?.scraping_status || 'idle'}</strong></span>
              </div>

              <button
                onClick={handleTriggerScrape}
                disabled={isScraping}
                className="px-5 py-2.5 rounded-xl font-medium text-xs text-[#0B0D0E] bg-gradient-to-r from-[#D4AF37] to-[#B88B28] hover:opacity-95 disabled:opacity-50 transition-all flex items-center space-x-2 shadow-lg shadow-gold-500/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                <span>{isScraping ? 'Scraping & Indexing...' : 'Start Scraping Job'}</span>
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {message && (
            <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
