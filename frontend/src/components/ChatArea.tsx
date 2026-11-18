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
  Sparkles,
  FileText,
  Image as ImageIcon,
  X as XIcon,
  Loader2
} from 'lucide-react';
import { ChatMessage, SourceCitation, ChatAttachment } from '../types';
import { api } from '../services/api';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string, overrideFilter?: string, attachment?: ChatAttachment) => void;
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
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await api.uploadFile(file);
      setPendingAttachment({
        name: res.name,
        url: res.url,
        size: res.size,
        type: res.content_type
      });
    } catch (err: any) {
      console.error('File upload failed:', err);
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !pendingAttachment) || isLoading || isUploading) return;
    const finalMsg = text || (pendingAttachment ? `Uploaded reference: ${pendingAttachment.name}` : '');
    onSendMessage(finalMsg, undefined, pendingAttachment || undefined);
    setInput('');
    setPendingAttachment(null);
  };

  const handleCopy = (id: string, text: string) => {
    // Copy clean text without asterisks
    const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/\*\*/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderCleanText = (rawContent: string) => {
    // Strip bold and italic markdown asterisks
    const stripped = rawContent
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\*\*/g, '')
      .replace(/__([^_]+)__/g, '$1');

    const lines = stripped.split('\n');
    return lines.map((line, lineIdx) => {
      // Parse markdown links: [Title](url)
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
      const parts: (string | React.ReactNode)[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        const label = match[1];
        const url = match[2];
        parts.push(
          <a
            key={`inline-link-${lineIdx}-${match.index}`}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-gold-400 hover:text-gold-300 underline underline-offset-2 inline-flex items-center gap-0.5 mx-1 font-medium transition-colors"
          >
            {label}
            <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-80" />
          </a>
        );
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <div key={lineIdx} className={line.trim() === '' ? 'h-2' : 'min-h-[1.25rem]'}>
          {parts.length > 0 ? parts : line}
        </div>
      );
    });
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
        {/* Hero Section — Luxury Villa Background with Left Charcoal Gradient */}
        <div className="relative rounded-3xl overflow-hidden border border-[#232730] min-h-[200px] md:min-h-[230px] mb-4 shadow-2xl flex items-center bg-[#0D0F12]">
          {/* Background Image: Luxury Villa, Pool & Glass Architecture */}
          <div
            className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none"
            style={{
              backgroundImage: "url('/images/hero-villa.jpg')",
              backgroundPosition: 'center right'
            }}
          />

          {/* Charcoal Gradient Overlay: Deep dark on left 55%, blending into transparent on right 45% */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D0E] via-[#0B0D0E]/85 via-50% to-[#0B0D0E]/20 pointer-events-none" />

          {/* Subtle top/bottom edge shade for seamless dark integration */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D0E]/40 via-transparent to-[#0B0D0E]/60 pointer-events-none" />

          {/* Left Hero Content (~55% width on desktop) */}
          <div className="relative z-10 p-6 md:p-7 max-w-full md:max-w-[58%] lg:max-w-[55%] space-y-2.5">
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-ivory-50 leading-tight">
              Your Real Estate <br />
              Intelligence Starts Here.
            </h1>
            <p className="text-xs text-[#9E9B92] leading-relaxed max-w-md">
              Explore luxury developments, property listings, locations, and opportunities across DarGlobal and Wasalt — powered by AI.
            </p>
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
                <div className="flex items-end justify-end space-x-2.5">
                  <div className="space-y-2 max-w-lg">
                    {msg.attachment && (
                      <div className="p-2 rounded-2xl bg-[#181B20] border border-[#252A32] shadow-sm">
                        {msg.attachment.type?.startsWith('image/') ? (
                          <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl group">
                            <img
                              src={msg.attachment.url}
                              alt={msg.attachment.name}
                              className="max-h-56 w-auto object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                            />
                          </a>
                        ) : (
                          <a
                            href={msg.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2.5 p-2 rounded-xl bg-[#121417] hover:bg-[#16181D] text-xs text-ivory-100 transition-colors"
                          >
                            <FileText className="w-5 h-5 text-gold-400 shrink-0" />
                            <div className="truncate">
                              <div className="font-medium truncate">{msg.attachment.name}</div>
                              {msg.attachment.size && (
                                <div className="text-[10px] text-[#7A776F]">{(msg.attachment.size / 1024).toFixed(0)} KB</div>
                              )}
                            </div>
                          </a>
                        )}
                      </div>
                    )}
                    {msg.content && (
                      <div className="bg-[#181B20] text-ivory-100 px-4 py-2.5 rounded-2xl rounded-tr-sm border border-[#252A32] text-xs md:text-sm shadow-sm">
                        {msg.content}
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#1F232A] border border-[#2E333C] flex items-center justify-center text-[#9E9A90] shrink-0 mb-1">
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
                    <div className="text-xs md:text-sm text-ivory-100/95 leading-relaxed space-y-1.5">
                      {renderCleanText(msg.content)}
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
        {/* Hidden File Input for Paperclip Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Uploaded File Chip Preview */}
        {pendingAttachment && (
          <div className="max-w-4xl mx-auto mb-2.5 flex items-center">
            <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#16181D] border border-gold-500/35 text-xs text-ivory-100 shadow-xl animate-in fade-in duration-200">
              {pendingAttachment.type?.startsWith('image/') ? (
                <img
                  src={pendingAttachment.url}
                  alt="preview"
                  className="w-6 h-6 rounded-md object-cover border border-white/10"
                />
              ) : (
                <FileText className="w-4 h-4 text-gold-400" />
              )}
              <span className="font-medium truncate max-w-xs">{pendingAttachment.name}</span>
              {pendingAttachment.size && (
                <span className="text-[10px] text-[#7A776F]">
                  ({(pendingAttachment.size / 1024).toFixed(0)} KB)
                </span>
              )}
              <button
                type="button"
                onClick={() => setPendingAttachment(null)}
                className="p-1 rounded-full hover:bg-[#252932] text-[#8E8B83] hover:text-ivory-100 transition-colors ml-1"
                title="Remove attachment"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative max-w-4xl mx-auto flex items-center bg-[#131519] border border-[#232730] focus-within:border-gold-500/50 rounded-2xl px-4 py-2.5 shadow-2xl transition-all"
        >
          {/* Active Upload Paperclip Icon */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isLoading}
            className={`p-1.5 transition-colors rounded-lg flex items-center justify-center ${
              pendingAttachment
                ? 'text-gold-400 bg-gold-500/15'
                : 'text-[#6D6B63] hover:text-gold-400 hover:bg-[#1A1D22]'
            }`}
            title="Attach floor plan, image, brochure, or property document"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              pendingAttachment
                ? `Ask about ${pendingAttachment.name}...`
                : "Ask anything about DarGlobal or Wasalt..."
            }
            className="flex-1 bg-transparent px-3 text-xs md:text-sm text-ivory-100 placeholder-[#6D6A62] focus:outline-none"
            disabled={isLoading}
          />

          {/* Circular Gold Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && !pendingAttachment) || isLoading || isUploading}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F1D88A] disabled:opacity-40 hover:opacity-95 text-[#0B0D0E] flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5 fill-current ml-0.5" />
          </button>
        </form>
      </div>
    </main>
  );
};
