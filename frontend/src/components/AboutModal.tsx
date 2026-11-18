import React from 'react';
import { X, Cpu, Database, Search, Shield, Bot } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#101215] border border-[#22262E] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#1A1D22] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-ivory-50">About PropIntel AI</h2>
              <p className="text-xs text-[#827F77]">DarGlobal & Wasalt Real Estate Intelligence Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#171A1F] hover:bg-[#20242B] text-[#9A968C] hover:text-ivory-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh] text-xs text-[#959187] leading-relaxed">
          <p>
            <strong className="text-ivory-100">PropIntel AI</strong> is an enterprise real estate intelligence platform built for technical assessment for the Junior AI Engineer role. It collects, normalizes, indexes, and answers user inquiries regarding luxury developments and domestic property listings from two primary official sources:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#14161A] border border-[#20242B]">
              <span className="text-gold-400 font-semibold block text-sm font-serif">DarGlobal</span>
              <p className="text-[11px] text-[#78756D] mt-1">
                International luxury master developer listed on the London Stock Exchange (LSE). Features ultra-luxury co-branded residences with Pagani, Aston Martin, Automobili Lamborghini, Fendi Casa, and Trump across UAE, Saudi Arabia, Oman, UK, and Spain.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#14161A] border border-[#20242B]">
              <span className="text-emerald-400 font-semibold block text-sm font-serif">Wasalt</span>
              <p className="text-[11px] text-[#78756D] mt-1">
                Leading Saudi Arabian domestic real estate marketplace operated by Quara Holding. Features verified sales and rental listings of villas, apartments, and lands across Riyadh, Jeddah, Makkah, and Dammam.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-semibold text-ivory-100 text-xs uppercase tracking-wider">Architecture & Pipeline</h4>
            <ul className="list-disc pl-4 space-y-1 text-[#838077]">
              <li><strong className="text-[#B5B2A6]">Extraction:</strong> Independent scrapers using Playwright and BeautifulSoup, respecting robots.txt and canonicalizing URLs.</li>
              <li><strong className="text-[#B5B2A6]">Vector Store:</strong> PostgreSQL with pgvector cosine similarity retrieval with configurable similarity threshold.</li>
              <li><strong className="text-[#B5B2A6]">Embeddings:</strong> SentenceTransformers <code className="text-gold-400">all-MiniLM-L6-v2</code> (384-dimensional dense vectors).</li>
              <li><strong className="text-[#B5B2A6]">LLM:</strong> OpenRouter free OpenAI-compatible chat completions API with exponential backoff and rate-limit retry.</li>
              <li><strong className="text-[#B5B2A6]">Source Citations:</strong> Clickable original source references and relevance scoring on every response.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
