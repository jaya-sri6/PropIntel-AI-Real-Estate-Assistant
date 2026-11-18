import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RightPanel } from './components/RightPanel';
import { DataExplorerModal } from './components/DataExplorerModal';
import { ProjectExplorerModal } from './components/ProjectExplorerModal';
import { ProjectExplorerView } from './components/ProjectExplorerView';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ConversationHistoryView } from './components/ConversationHistoryView';
import { AboutView } from './components/AboutView';
import { SourceViewerModal } from './components/SourceViewerModal';
import { ChatMessage, SourceCitation, AdminStats, ChatAttachment } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'chat' | 'history' | 'explorer' | 'projects' | 'admin' | 'about'>('chat');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [conversationId, setConversationId] = useState<string>(() => 'conv-' + Math.random().toString(36).substring(2, 9));
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSourcesModal, setActiveSourcesModal] = useState<SourceCitation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with the reference query from the screenshot
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-initial-user',
      role: 'user',
      content: 'What projects does DarGlobal have in Dubai?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'msg-initial-assistant',
      role: 'assistant',
      content: `DarGlobal has several luxury development projects in Dubai, including high-profile branded residences and exclusive communities. Here are some of the key projects:

• The Pagani Penthouse – Ultra-luxury residential tower overlooking Dubai Canal with bespoke interiors by Horacio Pagani.
• Trump International Hotel & Tower Dubai – Exclusive hospitality and branded tower development.
• Top of the Astera – Beachfront residences on Al Marjan Island with Aston Martin interiors.

These projects are part of DarGlobal's portfolio of international luxury developments.`,
      sources: [
        {
          title: 'DarGlobal Projects in Dubai',
          source: 'DarGlobal',
          url: 'https://darglobal.co.uk/one-of-one/project-pagani',
          relevance_score: 0.95
        },
        {
          title: 'DarGlobal Portfolio',
          source: 'DarGlobal',
          url: 'https://darglobal.co.uk/projects',
          relevance_score: 0.92
        },
        {
          title: 'About DarGlobal',
          source: 'DarGlobal',
          url: 'https://darglobal.co.uk/about',
          relevance_score: 0.87
        }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.fetchStats();
      setStats(data);
    } catch (err) {
      console.warn('Could not load stats initially:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadStats();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNewChat = () => {
    setConversationId('conv-' + Math.random().toString(36).substring(2, 9));
    setMessages([]);
  };

  const handleContinueConversation = (convId: string, pastMessages: ChatMessage[]) => {
    setConversationId(convId);
    setMessages(pastMessages);
    setCurrentTab('chat');
  };

  const handleSendMessage = async (userText: string, overrideFilter?: string, attachment?: ChatAttachment) => {
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: userText,
      attachment: attachment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const filterToUse = overrideFilter || sourceFilter;
    try {
      const result = await api.sendMessage(userText, conversationId, filterToUse, attachment);
      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: `Service Notice: ${err.message || 'Unable to connect to PropIntel backend service.'}`,
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (promptText: string) => {
    let effectiveFilter = sourceFilter;
    const pLower = promptText.toLowerCase();
    if (pLower.includes('darglobal') && sourceFilter === 'Wasalt') {
      setSourceFilter('all');
      effectiveFilter = 'all';
    } else if (pLower.includes('wasalt') && sourceFilter === 'DarGlobal') {
      setSourceFilter('all');
      effectiveFilter = 'all';
    } else if (pLower.includes('compare')) {
      setSourceFilter('all');
      effectiveFilter = 'all';
    }
    handleSendMessage(promptText, effectiveFilter);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0D0E] font-sans text-ivory-100">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        onNewChat={handleNewChat}
      />

      {/* Center & Right Area: Switches to Admin Dashboard, Conversation History, About, or Project Explorer based on currentTab */}
      {currentTab === 'admin' ? (
        <AdminDashboardView stats={stats} onRefresh={loadStats} />
      ) : currentTab === 'history' ? (
        <ConversationHistoryView onContinueConversation={handleContinueConversation} />
      ) : currentTab === 'about' ? (
        <AboutView />
      ) : currentTab === 'projects' ? (
        <ProjectExplorerView />
      ) : (
        <>
          {/* Main Center Chat */}
          <ChatArea
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onSelectPrompt={handleSelectPrompt}
            onOpenSourceModal={(sources) => setActiveSourcesModal(sources)}
          />

          {/* Right Overview & Quick Actions Panel */}
          <RightPanel
            stats={stats}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onViewAllProjects={() => setCurrentTab('projects')}
          />
        </>
      )}

      {/* Data Explorer Listing & Market Data Modal */}
      <DataExplorerModal
        isOpen={currentTab === 'explorer'}
        onClose={() => setCurrentTab('chat')}
      />

      {/* Source Citations Modal */}
      <SourceViewerModal
        isOpen={!!activeSourcesModal}
        sources={activeSourcesModal || []}
        onClose={() => setActiveSourcesModal(null)}
      />
    </div>
  );
};
export default App;
