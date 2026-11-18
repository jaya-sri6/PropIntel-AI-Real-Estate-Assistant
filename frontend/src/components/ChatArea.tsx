import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Home,
  Globe,
  Search,
  Paperclip,
  Send,
  ExternalLink,
  Copy,
  Eye,
  Check,
  User,
  Sparkles
} from 'lucide-react';
import { ChatMessage, SourceCitation } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  onSelectPrompt: (prompt: string) => void;
  onOpenSourceModal: (sources: SourceCitation[]) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSelectPrompt,
  onOpenSourceModal
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const promptPills = [
    { text: 'Explore DarGlobal projects in Dubai', icon: Building2 },
    { text: 'Find villas in Riyadh', icon: Home },
    { text: 'Compare DarGlobal and Wasalt', icon: Globe },
    { text: 'Show me property listings', icon: Search }
  ];

  return (
    <main className="flex-1 h-full flex flex-col justify-between bg-[#0B0D0E] overflow-hidden relative">
      {/* Scrollable Chat & Hero Container */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Hero Section (Always visible or compact) */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#111316] via-[#14161A] to-[#121417] border border-[#1E2228] p-7 mb-4 shadow-xl flex items-center justify-between">
          {/* Left Text */}
          <div className="max-w-xl z-10 space-y-2.5">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ivory-50 leading-tight">
              Your Real Estate <br />
              Intelligence Starts Here.
            </h1>
            <p className="text-xs md:text-sm text-[#8D8A82] leading-relaxed max-w-md">
              Explore luxury developments, property listings, locations, and opportunities across DarGlobal and Wasalt — powered by AI.
            </p>
          </div>

          {/* Right Villa Image Crop */}
          <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden pointer-events-none opacity-85 mask-gradient">
            <img
              src="/hero-reference.jpg"
              alt="Luxury Architecture"
              className="w-full h-full object-cover object-right"
            />
            {/* Soft gradient blend on the left of image */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111316] via-[#111316]/50 to-transparent" />
          </div>
        </div>

        {/* Prompt Suggestion Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
          {promptPills.map((pill, idx) => {
            const Icon = pill.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectPrompt(pill.text)}
                className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl bg-[#121417] hover:bg-[#181B20] border border-[#1E2228] hover:border-gold-500/40 text-left transition-all duration-200 group shadow-sm"
              >
                <div className="w-6 h-6 rounded-lg bg-[#1A1D22] border border-[#262B33] group-hover:border-gold-500/50 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gold-400" />
                </div>
                <span className="text-xs text-[#9E9B92] group-hover:text-ivory-100 font-medium truncate">
                  {pill.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Messages Stream */}
        <div className="space-y-6 pt-2">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {msg.role === 'user' ? (
                /* User Message Bubble */
                <div className="flex items-center justify-end space-x-2.5">
                  <div className="bg-[#181B20] text-ivory-100 px-4 py-2.5 rounded-2xl rounded-tr-sm border border-[#252A32] text-xs md:text-sm max-w-lg shadow-sm">
                    {msg.content}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#1F232A] border border-[#2E333C] flex items-center justify-center text-[#9E9A90] shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                /* Assistant Message Card */
                <div className="flex items-start space-x-3 max-w-4xl">
                  {/* Logo Emblem Icon */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400/20 to-charcoal-850 border border-gold-400/40 flex items-center justify-center p-1.5 shrink-0 mt-0.5 shadow-sm">
                    <img src="/logo.svg" alt="PropIntel Emblem" className="w-full h-full object-contain" />
                  </div>

                  {/* Main Response Container */}
                  <div className="flex-1 bg-[#121417] border border-[#1F2329] rounded-2xl p-5 shadow-lg space-y-4">
                    {/* Answer Text */}
                    <div className="text-xs md:text-sm text-ivory-100/95 leading-relaxed space-y-2 whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {/* Sources (N) Cards */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-[#1C2026]">
                        <div className="text-[11px] font-semibold text-[#86837A] tracking-wider uppercase mb-2.5">
                          Sources ({msg.sources.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {msg.sources.slice(0, 3).map((src, sIdx) => {
                            let domain = 'official';
                            try {
                              domain = new URL(src.url).hostname.replace('www.', '');
                            } catch {
                              domain = src.source.toLowerCase();
                            }
                            return (
                              <a
                                key={sIdx}
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 rounded-xl bg-[#16181D] hover:bg-[#1C1F25] border border-[#22262E] hover:border-gold-500/40 transition-all flex flex-col justify-between group"
                              >
                                <div className="flex items-start justify-between gap-1 mb-1.5">
                                  <span className="text-xs font-medium text-ivory-100 group-hover:text-gold-300 truncate">
                                    {src.title}
                                  </span>
                                  <ExternalLink className="w-3.5 h-3.5 text-[#6B6860] group-hover:text-gold-400 shrink-0" />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] text-[#716E66]">{domain}</span>
                                  <span className="text-[10px] font-medium text-gold-400/90 bg-gold-500/10 border border-gold-500/20 px-1.5 py-0.5 rounded-md">
                                    Relevance: {Math.round((src.relevance_score || 0.88) * 100)}%
                                  </span>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#181A1F] hover:bg-[#20232A] border border-[#252830] text-[11px] text-[#8E8B82] hover:text-ivory-100 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Response</span>
                          </>
                        )}
                      </button>

                      {msg.sources && msg.sources.length > 0 && (
                        <button
                          onClick={() => onOpenSourceModal(msg.sources || [])}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#181A1F] hover:bg-[#20232A] border border-[#252830] text-[11px] text-[#8E8B82] hover:text-ivory-100 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Sources</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start space-x-3 max-w-xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400/20 to-charcoal-850 border border-gold-400/40 flex items-center justify-center p-1.5 shrink-0 mt-0.5 animate-pulse">
                <img src="/logo.svg" alt="PropIntel Emblem" className="w-full h-full object-contain" />
              </div>
              <div className="bg-[#121417] border border-[#1F2329] rounded-2xl px-4 py-3 flex items-center space-x-2 shadow-md">
                <div className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gold-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-gold-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-[#8E8B82] ml-1">PropIntel AI is searching real estate data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Floating Input Bar */}
      <div className="p-6 bg-gradient-to-t from-[#0B0D0E] via-[#0B0D0E] to-transparent">
        <form
          onSubmit={handleSubmit}
          className="relative max-w-4xl mx-auto flex items-center bg-[#131519] border border-[#232730] focus-within:border-gold-500/50 rounded-2xl px-4 py-2.5 shadow-2xl transition-all"
        >
          {/* Attachment Icon */}
          <button
            type="button"
            className="p-1.5 text-[#6D6B63] hover:text-ivory-100 transition-colors"
            title="Attach reference"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about DarGlobal or Wasalt..."
            className="flex-1 bg-transparent px-3 text-xs md:text-sm text-ivory-100 placeholder-[#6D6A62] focus:outline-none"
            disabled={isLoading}
          />

          {/* Circular Gold Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F1D88A] disabled:opacity-40 hover:opacity-95 text-[#0B0D0E] flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5 fill-current ml-0.5" />
          </button>
        </form>
      </div>
    </main>
  );
};
