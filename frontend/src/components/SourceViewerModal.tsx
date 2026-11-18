import React from 'react';
import { X, ExternalLink, Globe } from 'lucide-react';
import { SourceCitation } from '../types';

interface SourceViewerModalProps {
  sources: SourceCitation[];
  isOpen: boolean;
  onClose: () => void;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({
  sources,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-[#101215] border border-[#22262E] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[#1A1D22] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Globe className="w-4 h-4 text-gold-400" />
            <h2 className="text-base font-serif font-bold text-ivory-50">Retrieved Evidence Sources</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#171A1F] hover:bg-[#20242B] text-[#9A968C] hover:text-ivory-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {sources.map((src, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[#15171C] border border-[#232730] flex items-start justify-between gap-3">
              <div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                  src.source === 'DarGlobal'
                    ? 'bg-gold-500/10 text-gold-400 border-gold-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {src.source}
                </span>
                <h4 className="text-xs font-semibold text-ivory-100 mt-1.5">{src.title}</h4>
                <p className="text-[11px] text-[#78756D] truncate mt-0.5 max-w-sm">{src.url}</p>
                {src.relevance_score && (
                  <div className="text-[10px] text-gold-400 font-medium mt-1">
                    Similarity Score: {Math.round(src.relevance_score * 100)}%
                  </div>
                )}
              </div>
              <a
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#1D2128] hover:bg-gold-500/20 text-gold-400 border border-[#282E38] transition-colors shrink-0"
                title="Open original website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
