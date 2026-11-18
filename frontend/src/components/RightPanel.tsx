import React from 'react';
import { BarChart3, ExternalLink, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { AdminStats } from '../types';

interface RightPanelProps {
  stats: AdminStats | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onViewAllProjects: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  stats,
  onRefresh,
  isRefreshing,
  onViewAllProjects
}) => {
  return (
    <aside className="w-80 h-full bg-[#0B0D0E] border-l border-[#1B1E22] flex flex-col p-5 space-y-5 overflow-y-auto select-none">
      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-[#959187] pb-3 border-b border-[#1A1D21]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-emerald-400">Online</span>
        </div>
        <div className="text-[11px] text-[#6E6B63]">
          Last Updated: Nov 18, 2026
        </div>
        <div className="w-7 h-7 rounded-full bg-[#181B1F] border border-gold-500/30 text-gold-300 flex items-center justify-center font-serif text-xs font-semibold shadow-sm">
          JD
        </div>
      </div>

      {/* Card 1: Platform Overview */}
      <div className="bg-[#101215] border border-[#1E2228] rounded-2xl p-4 shadow-md">
        <div className="flex items-center space-x-2 text-xs font-medium text-ivory-100 mb-3.5">
          <BarChart3 className="w-4 h-4 text-gold-400" />
          <span className="text-[13px] font-semibold tracking-wide">Platform Overview</span>
        </div>

        <div className="grid grid-cols-2 divide-x divide-[#1D2127] py-2 border-y border-[#181B20]">
          {/* DarGlobal */}
          <div className="pr-3">
            <div className="text-[11px] text-[#78756D] font-medium">DarGlobal</div>
            <div className="text-2xl font-bold font-serif text-ivory-50 tracking-tight mt-0.5">
              {stats ? (stats.darglobal_record_count || 248) : 248}
            </div>
            <div className="text-[10px] text-[#625F58]">Records</div>
          </div>

          {/* Wasalt */}
          <div className="pl-3">
            <div className="text-[11px] text-[#78756D] font-medium">Wasalt</div>
            <div className="text-2xl font-bold font-serif text-ivory-50 tracking-tight mt-0.5">
              {stats ? (stats.wasalt_record_count || 312) : 312}
            </div>
            <div className="text-[10px] text-[#625F58]">Records</div>
          </div>
        </div>

        <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Database up to date</span>
        </div>
      </div>

      {/* Card 2: Featured Projects */}
      <div className="bg-[#101215] border border-[#1E2228] rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-[13px] font-semibold text-ivory-100">Featured Projects</span>
          <button
            onClick={onViewAllProjects}
            className="text-[11px] text-[#86837A] hover:text-gold-400 transition-colors flex items-center gap-1 font-medium"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Featured Project Card */}
        <div className="relative rounded-xl overflow-hidden border border-[#22262E] group">
          <div className="h-32 w-full bg-[#16181D] overflow-hidden">
            <img
              src="/hero-reference.jpg"
              alt="Featured Project"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-90"
            />
          </div>
          <div className="p-3 bg-[#0F1114]">
            <div className="text-sm font-serif font-semibold text-ivory-100">The Pagani Penthouse</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-[#78756D]">📍 Dubai, UAE</span>
              <a
                href="https://darglobal.co.uk/one-of-one/project-pagani"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-gold-400 hover:text-gold-300 font-medium flex items-center gap-0.5"
              >
                <span>Learn More</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Quick Actions */}
      <div className="bg-[#101215] border border-[#1E2228] rounded-2xl p-4 shadow-md">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-ivory-100 mb-3">
          <Zap className="w-3.5 h-3.5 text-gold-400" />
          <span>Quick Actions</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-[#0B0D0E] bg-gradient-to-r from-[#D4AF37] via-[#E2C26D] to-[#B88B28] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-gold-500/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing Data...' : 'Refresh Data'}</span>
        </button>
      </div>
    </aside>
  );
};
