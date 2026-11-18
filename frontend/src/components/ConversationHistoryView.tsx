import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  ArrowRight,
  Download,
  Share2,
  Trash2,
  User,
  ExternalLink,
  Clock
} from 'lucide-react';
import { ChatMessage, SourceCitation } from '../types';
import { api } from '../services/api';

interface ConversationSession {
  id: string;
  title: string;
  created_at?: string;
  formatted_date: string;
  message_count: number;
  messages: ChatMessage[];
}

interface ConversationHistoryViewProps {
  onContinueConversation: (conversationId: string, messages: ChatMessage[]) => void;
}

export const ConversationHistoryView: React.FC<ConversationHistoryViewProps> = ({
  onContinueConversation
}) => {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback sample sessions matching the reference design if database has few
  const defaultSampleSessions: ConversationSession[] = [
    {
      id: 'session-sample-1',
      title: 'DarGlobal projects in Dubai',
      formatted_date: 'Apr 28, 14:32',
      message_count: 2,
      messages: [
        {
          id: 's1-m1',
          role: 'user',
          content: 'What projects does DarGlobal have in Dubai?',
          timestamp: 'Apr 28, 2025 • 14:32'
        },
        {
          id: 's1-m2',
          role: 'assistant',
          content: 'DarGlobal has several luxury development projects in Dubai, including The Pagani Penthouse, DG1 on Dubai Canal, Urban Oasis by Missoni, and Neptune Villas. These branded residences offer bespoke interiors and waterfront views.',
          timestamp: 'Apr 28, 2025 • 14:32'
        }
      ]
    },
    {
      id: 'session-sample-2',
      title: 'Compare DarGlobal and Wasalt',
      formatted_date: 'Apr 28, 14:20',
      message_count: 2,
      messages: [
        {
          id: 's2-m1',
          role: 'user',
          content: 'Compare DarGlobal and Wasalt real estate portfolios.',
          timestamp: 'Apr 28, 2025 • 14:20'
        },
        {
          id: 's2-m2',
          role: 'assistant',
          content: 'DarGlobal specializes in international ultra-luxury branded residences across UAE, Saudi Arabia, Oman, UK, and Spain with high-end designer partnerships (Pagani, Missoni, Elie Saab, Aston Martin). Wasalt is Saudi Arabia premier marketplace connecting buyers and renters with domestic properties, villas, and master communities across Riyadh, Jeddah, and Madinah.',
          timestamp: 'Apr 28, 2025 • 14:20'
        }
      ]
    },
    {
      id: 'session-sample-3',
      title: 'Villas in Riyadh',
      formatted_date: 'Apr 28, 13:45',
      message_count: 2,
      messages: [
        {
          id: 's3-m1',
          role: 'user',
          content: 'Find villas for sale in Riyadh.',
          timestamp: 'Apr 28, 2025 • 13:45'
        },
        {
          id: 's3-m2',
          role: 'assistant',
          content: 'Available villas in Riyadh include:\n• Villa 400 SQM in North Riyadh (3,400,000 SAR)\n• Villa 318.27 SQM in Al-Hazm (1,300,000 SAR)\n• Retal Residence luxury compound in Al-Nakheel\n• Al Khozama Luxury Residences in West Riyadh.',
          timestamp: 'Apr 28, 2025 • 13:45'
        }
      ]
    },
    {
      id: 'session-sample-4',
      title: 'Latest projects',
      formatted_date: 'Apr 27, 17:20',
      message_count: 2,
      messages: [
        {
          id: 's4-m1',
          role: 'user',
          content: 'Show me the latest residential master developments.',
          timestamp: 'Apr 27, 2025 • 17:20'
        },
        {
          id: 's4-m2',
          role: 'assistant',
          content: 'Latest residential master developments include Shams Al Riyadh (47 units from 2.40M SAR), Sedra Master Community by ROSHN, Darwaza in Al Aarid, and Soleya at the Red Sea in KAEC.',
          timestamp: 'Apr 27, 2025 • 17:20'
        }
      ]
    }
  ];

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await api.fetchConversations();
      if (data && data.length > 0) {
        setSessions(data);
        setSelectedId(data[0].id);
      } else {
        setSessions(defaultSampleSessions);
        setSelectedId(defaultSampleSessions[0].id);
      }
    } catch (err) {
      console.warn('Could not load conversations from server, showing sample history:', err);
      setSessions(defaultSampleSessions);
      setSelectedId(defaultSampleSessions[0].id);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
    } catch {
      // Local removal
    }
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (selectedId === id && filtered.length > 0) {
        setSelectedId(filtered[0].id);
      }
      return filtered;
    });
  };

  const activeSession = sessions.find((s) => s.id === selectedId) || sessions[0];

  return (
    <div className="flex-1 h-full bg-[#0B0D0E] overflow-y-auto p-8 space-y-6 flex flex-col">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-ivory-50 tracking-tight">Conversation History</h1>
        <p className="text-xs text-[#827F77] mt-0.5">Access your past conversations</p>
      </div>

      {/* Main Two-Column Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[550px] pb-6">
        {/* Left Column: Conversations List (approx 4/12 or 5/12 width) */}
        <div className="md:col-span-4 lg:col-span-4 bg-[#121417] border border-[#20242B] rounded-2xl p-3 flex flex-col space-y-2 overflow-y-auto max-h-[72vh] shadow-xl">
          {sessions.map((sess) => {
            const isSelected = sess.id === (activeSession?.id);
            return (
              <div
                key={sess.id}
                onClick={() => setSelectedId(sess.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-[#181B20] border border-gold-500/40 text-ivory-100 shadow-sm'
                    : 'bg-[#15171C]/50 hover:bg-[#181B20] border border-transparent text-[#9E9B92] hover:text-ivory-100'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                        : 'bg-[#1C1F26] text-[#716E66] border border-[#262B34] group-hover:text-gold-400'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-medium truncate group-hover:text-ivory-100">
                      {sess.title}
                    </div>
                    <div className="text-[11px] text-[#6E6B63] mt-0.5">
                      {sess.formatted_date}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <button
                    onClick={(e) => handleDelete(e, sess.id)}
                    className="p-1.5 rounded-lg text-[#6E6B63] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                    title="Delete Conversation"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Conversation Preview Thread (approx 8/12 width) */}
        <div className="md:col-span-8 lg:col-span-8 bg-[#121417] border border-[#20242B] rounded-2xl p-6 flex flex-col justify-between max-h-[72vh] shadow-xl overflow-hidden">
          {activeSession ? (
            <>
              {/* Active Conversation Header */}
              <div className="pb-4 border-b border-[#1C2027]">
                <h2 className="text-base font-serif font-semibold text-gold-300">
                  {activeSession.title}
                </h2>
                <p className="text-xs text-[#716E66] mt-0.5">
                  {activeSession.formatted_date}
                </p>
              </div>

              {/* Chat Thread Messages Stream */}
              <div className="flex-1 overflow-y-auto py-5 space-y-4">
                {activeSession.messages.map((m, idx) => (
                  <div key={idx} className="space-y-3">
                    {m.role === 'user' ? (
                      /* User Message Bubble */
                      <div className="flex items-center justify-end space-x-2.5">
                        <div className="bg-[#181B20] text-ivory-100 px-4 py-2.5 rounded-2xl rounded-tr-sm border border-[#252A32] text-xs max-w-md shadow-sm">
                          {m.content}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#1F232A] border border-[#2E333C] flex items-center justify-center text-[#9E9A90] shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : (
                      /* Assistant Message Card */
                      <div className="flex items-start space-x-3 max-w-2xl">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400/20 to-charcoal-850 border border-gold-400/40 flex items-center justify-center p-1.5 shrink-0 mt-0.5">
                          <img src="/logo.svg" alt="PropIntel" className="w-full h-full object-contain" />
                        </div>
                        <div className="bg-[#15171C] border border-[#232730] rounded-2xl p-4 text-xs text-ivory-100/90 leading-relaxed space-y-1.5 shadow-sm">
                          {m.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-4 border-t border-[#1C2027] flex items-center justify-end space-x-3">
                <button
                  onClick={() => onContinueConversation(activeSession.id, activeSession.messages)}
                  className="px-4 py-2 rounded-xl bg-transparent border border-gold-500/50 hover:bg-gold-500/10 text-gold-300 hover:text-gold-200 text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <span>Continue Conversation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    const text = activeSession.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${activeSession.title.replace(/\s+/g, '_')}.txt`;
                    a.click();
                  }}
                  className="p-2 rounded-xl bg-[#16181D] hover:bg-[#1E222A] border border-[#252A33] text-[#8E8B82] hover:text-ivory-100 transition-colors"
                  title="Export Transcript"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-[#716E66]">
              No past conversations found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
