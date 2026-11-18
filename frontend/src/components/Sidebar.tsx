import React from 'react';
import { MessageSquare, LayoutGrid, ShieldCheck, Info, Check, CheckCircle2, Circle } from 'lucide-react';

interface SidebarProps {
  currentTab: 'chat' | 'explorer' | 'admin' | 'about';
  setCurrentTab: (tab: 'chat' | 'explorer' | 'admin' | 'about') => void;
  sourceFilter: string;
  setSourceFilter: (source: string) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  sourceFilter,
  setSourceFilter,
  onNewChat
}) => {
  return (
    <aside className="w-64 h-full bg-[#0B0D0E] border-r border-[#1B1E22] flex flex-col justify-between select-none">
      {/* Top Header & Brand */}
      <div>
        <div className="p-6 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400/20 to-charcoal-850 border border-gold-400/30 flex items-center justify-center p-1.5 shadow-sm">
            <img src="/logo.svg" alt="PropIntel AI Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-serif tracking-wide text-[17px] font-semibold text-ivory-100 flex items-center gap-1.5">
              <span>PropIntel AI</span>
            </div>
            <p className="text-[11px] text-[#8E8B82] tracking-wider uppercase font-medium">Real Estate Intelligence</p>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="px-4 space-y-1.5 mt-2">
          {/* New Chat */}
          <button
            onClick={() => {
              setCurrentTab('chat');
              onNewChat();
            }}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              currentTab === 'chat'
                ? 'bg-[#1C1813] text-gold-300 border border-gold-500/30 shadow-inner'
                : 'text-[#9A968B] hover:text-ivory-100 hover:bg-[#131518]'
            }`}
          >
            <MessageSquare className={`w-4 h-4 ${currentTab === 'chat' ? 'text-gold-400' : 'text-[#7A776F]'}`} />
            <span>New Chat</span>
          </button>

          {/* Data Explorer */}
          <button
            onClick={() => setCurrentTab('explorer')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              currentTab === 'explorer'
                ? 'bg-[#1C1813] text-gold-300 border border-gold-500/30'
                : 'text-[#9A968B] hover:text-ivory-100 hover:bg-[#131518]'
            }`}
          >
            <LayoutGrid className={`w-4 h-4 ${currentTab === 'explorer' ? 'text-gold-400' : 'text-[#7A776F]'}`} />
            <span>Data Explorer</span>
          </button>

          {/* Admin Dashboard */}
          <button
            onClick={() => setCurrentTab('admin')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              currentTab === 'admin'
                ? 'bg-[#1C1813] text-gold-300 border border-gold-500/30'
                : 'text-[#9A968B] hover:text-ivory-100 hover:bg-[#131518]'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${currentTab === 'admin' ? 'text-gold-400' : 'text-[#7A776F]'}`} />
            <span>Admin Dashboard</span>
          </button>

          {/* About */}
          <button
            onClick={() => setCurrentTab('about')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              currentTab === 'about'
                ? 'bg-[#1C1813] text-gold-300 border border-gold-500/30'
                : 'text-[#9A968B] hover:text-ivory-100 hover:bg-[#131518]'
            }`}
          >
            <Info className={`w-4 h-4 ${currentTab === 'about' ? 'text-gold-400' : 'text-[#7A776F]'}`} />
            <span>About</span>
          </button>
        </div>

        {/* Separator */}
        <div className="mx-5 my-6 border-t border-[#1C1F24]" />

        {/* Sources Section */}
        <div className="px-5">
          <div className="text-[12px] font-semibold text-[#86837A] tracking-wider uppercase mb-3">
            Sources
          </div>

          <div className="space-y-2.5">
            {/* DarGlobal */}
            <button
              onClick={() => setSourceFilter(sourceFilter === 'DarGlobal' ? 'all' : 'DarGlobal')}
              className="flex items-center space-x-2.5 text-xs text-ivory-200/90 hover:text-ivory-100 transition-colors w-full text-left py-1"
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                sourceFilter === 'DarGlobal' || sourceFilter === 'all'
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50'
                  : 'border border-[#3A3D44] text-transparent'
              }`}>
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className={sourceFilter === 'DarGlobal' ? 'text-gold-300 font-medium' : ''}>DarGlobal</span>
            </button>

            {/* Wasalt */}
            <button
              onClick={() => setSourceFilter(sourceFilter === 'Wasalt' ? 'all' : 'Wasalt')}
              className="flex items-center space-x-2.5 text-xs text-ivory-200/90 hover:text-ivory-100 transition-colors w-full text-left py-1"
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                sourceFilter === 'Wasalt' || sourceFilter === 'all'
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50'
                  : 'border border-[#3A3D44] text-transparent'
              }`}>
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className={sourceFilter === 'Wasalt' ? 'text-gold-300 font-medium' : ''}>Wasalt</span>
            </button>

            {/* All Sources */}
            <button
              onClick={() => setSourceFilter('all')}
              className="flex items-center space-x-2.5 text-xs text-ivory-200/90 hover:text-ivory-100 transition-colors w-full text-left py-1"
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                sourceFilter === 'all'
                  ? 'border-2 border-gold-400 text-gold-400'
                  : 'border border-[#3A3D44] text-transparent'
              }`}>
                {sourceFilter === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />}
              </div>
              <span className={sourceFilter === 'all' ? 'text-gold-300 font-medium' : ''}>All Sources</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Skyline & Powered By */}
      <div className="relative pt-10 pb-5 px-5">
        {/* Glowing skyline silhouette */}
        <div className="w-full h-24 overflow-hidden mb-3 opacity-70">
          <img src="/skyline.svg" alt="Skyline" className="w-full h-full object-cover" />
        </div>
        <div className="text-[11px] text-[#6E6B63] leading-tight">
          Powered by <br />
          <span className="text-gold-400/90 font-medium">DarGlobal & Wasalt</span>
        </div>
      </div>
    </aside>
  );
};
