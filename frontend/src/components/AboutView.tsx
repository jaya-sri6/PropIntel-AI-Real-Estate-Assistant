import React, { useState } from 'react';
import {
  Building2,
  Sparkles,
  Database,
  Server,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  CheckCircle2
} from 'lucide-react';

interface AboutViewProps {
  onExploreProjects?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onExploreProjects }) => {
  const [showArchitecture, setShowArchitecture] = useState(false);

  return (
    <div className="flex-1 h-full bg-[#07080A] relative overflow-hidden flex flex-col justify-between p-8 md:p-12">
      {/* Background Panoramic Dubai Skyline Image — Crisp, Vibrant & Luminous */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none opacity-100"
        style={{
          backgroundImage: "url('/images/about-skyline.jpg')",
          backgroundPosition: 'right center'
        }}
      />

      {/* Soft gradient on the left side only to ensure crystal-clear text contrast, leaving the skyline fully visible */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#07080A] via-[#07080A]/75 via-30% to-transparent pointer-events-none" />

      {/* Subtle bottom grounding for feature cards */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07080A]/50 to-transparent pointer-events-none" />

      {/* Main Content Area (Left aligned) */}
      <div className="relative z-10 max-w-2xl space-y-4 pt-4 md:pt-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-ivory-50 tracking-tight leading-tight">
          About PropIntel AI
        </h1>

        <p className="text-base md:text-lg text-ivory-100 font-medium">
          Real Estate Intelligence, Reimagined.
        </p>

        <p className="text-xs md:text-sm text-[#9E9B92] leading-relaxed max-w-xl">
          PropIntel AI is an intelligent real estate research assistant that combines information from DarGlobal and Wasalt, powered by advanced AI and reliable data sources.
        </p>

        <div className="pt-2">
          <button
            onClick={() => setShowArchitecture(!showArchitecture)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E2C26D] to-[#B88B28] hover:opacity-95 text-[#0B0D0E] font-medium text-xs flex items-center space-x-2 shadow-lg shadow-gold-500/10 active:scale-95 transition-all"
          >
            <span>{showArchitecture ? 'Hide System Specs' : 'Learn More'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable Architecture Specs */}
        {showArchitecture && (
          <div className="mt-4 p-5 rounded-2xl bg-[#121417]/95 border border-gold-500/30 backdrop-blur-md shadow-2xl text-xs space-y-3 animate-in fade-in duration-300 max-w-xl">
            <div className="text-gold-300 font-serif font-semibold text-sm">
              Architecture & System Pipeline
            </div>
            <ul className="space-y-2 text-[#9A968C] leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 mt-0.5 shrink-0" />
                <span><strong className="text-ivory-100">Scraping Pipeline:</strong> Automated scrapers for DarGlobal international luxury projects and Wasalt verified Saudi property marketplace.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 mt-0.5 shrink-0" />
                <span><strong className="text-ivory-100">Vector Search:</strong> Dense 384-dimensional embeddings via SentenceTransformers <code className="text-gold-300">all-MiniLM-L6-v2</code> with cosine similarity thresholding.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 mt-0.5 shrink-0" />
                <span><strong className="text-ivory-100">Generative AI:</strong> Grounded RAG with strict factual alignment and OpenRouter LLM completions.</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Bottom Feature Cards (4 in a row across the base) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8">
        {/* Card 1: Data Sources */}
        <div className="bg-[#121417]/90 border border-[#22262E] hover:border-gold-500/30 rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg backdrop-blur-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-ivory-100">Data Sources</div>
            <div className="text-[11px] text-[#78756D] mt-0.5">DarGlobal & Wasalt</div>
          </div>
        </div>

        {/* Card 2: AI Technology */}
        <div className="bg-[#121417]/90 border border-[#22262E] hover:border-gold-500/30 rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg backdrop-blur-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-ivory-100">AI Technology</div>
            <div className="text-[11px] text-[#78756D] mt-0.5">RAG + OpenRouter</div>
          </div>
        </div>

        {/* Card 3: Database */}
        <div className="bg-[#121417]/90 border border-[#22262E] hover:border-gold-500/30 rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg backdrop-blur-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-ivory-100">Database</div>
            <div className="text-[11px] text-[#78756D] mt-0.5">PostgreSQL + pgvector</div>
          </div>
        </div>

        {/* Card 4: Deployment */}
        <div className="bg-[#121417]/90 border border-[#22262E] hover:border-gold-500/30 rounded-2xl p-4 flex items-center space-x-3.5 shadow-lg backdrop-blur-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center shrink-0">
            <Server className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-ivory-100">Deployment</div>
            <div className="text-[11px] text-[#78756D] mt-0.5">Docker + Render</div>
          </div>
        </div>
      </div>
    </div>
  );
};
