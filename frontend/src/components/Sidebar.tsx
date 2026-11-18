import React from 'react';
import { MessageSquare, History, LayoutGrid, Building2, ShieldCheck, Info, Check, CheckCircle2, Circle } from 'lucide-react';

interface SidebarProps {
  currentTab: 'chat' | 'history' | 'explorer' | 'projects' | 'admin' | 'about';
  setCurrentTab: (tab: 'chat' | 'history' | 'explorer' | 'projects' | 'admin' | 'about') => void;
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

          {/* Conversation History */}
          <button
            onClick={() => setCurrentTab('history')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              currentTab === 'history'
                ? 'bg-[#1C1813] text-gold-300 border border-gold-500/30'
                : 'text-[#9A968B] hover:text-ivory-100 hover:bg-[#131518]'
            }`}
          >
            <History className={`w-4 h-4 ${currentTab === 'history' ? 'text-gold-400' : 'text-[#7A776F]'}`} />
            <span>Conversation History</span>
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

          {/* Project Explorer */}
          <button
            onClick={() => setCurrentTab('projects')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              currentTab === 'projects'
                ? 'bg-[#1C1813] text-gold-300 border border-gold-500/30'
                : 'text-[#9A968B] hover:text-ivory-100 hover:bg-[#131518]'
            }`}
          >
            <Building2 className={`w-4 h-4 ${currentTab === 'projects' ? 'text-gold-400' : 'text-[#7A776F]'}`} />
            <span>Project Explorer</span>
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

      {/* Bottom Dubai Skyline Card & Powered By */}
      <div className="p-4 pt-2 mt-auto">
        <div className="relative rounded-2xl overflow-hidden border border-[#20242B] bg-[#111317] shadow-lg group">
          {/* Skyline image fitted cleanly showing Burj Khalifa and night lights */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
            <img
              src="/images/dubai-skyline.jpg"
              alt="Dubai Skyline & Burj Khalifa"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-95"
            />
            {/* Soft gradient blend at bottom of image */}
            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#111317] to-transparent pointer-events-none" />
          </div>

          {/* Powered by Text Footer */}
          <div className="px-3 py-2 bg-[#111317] border-t border-[#1C2027] flex items-center justify-between">
            <div className="leading-tight">
              <div className="text-[10px] text-[#78756D] uppercase tracking-wider font-semibold">
                Intelligence Platform
              </div>
              <div className="text-xs text-ivory-100 font-medium">
                DarGlobal <span className="text-gold-400">&</span> Wasalt
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Connected" />
          </div>
        </div>
      </div>
    </aside>
  );
};
