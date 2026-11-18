import React, { useState, useEffect } from 'react';
import { X, Search, Filter, ExternalLink, Building2, MapPin, Tag, Sparkles } from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';
import { SafeImage } from './SafeImage';
import { getProjectImage } from '../utils/imageHelper';

interface ProjectExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectExplorerModal: React.FC<ProjectExplorerModalProps> = ({ isOpen, onClose }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, sourceFilter, countryFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '80' };
      if (sourceFilter !== 'all') params.source = sourceFilter;
      if (countryFilter !== 'all') params.country = countryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.fetchProjects(params);
      setProjects(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProjects();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[85vh] bg-[#101215] border border-[#22262E] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#1A1D22] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-ivory-50">Project Explorer</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30 font-medium">
                  {total} Developments
                </span>
              </div>
              <p className="text-xs text-[#827F77] mt-0.5">
                Explore luxury developments, master communities, and branded residences across DarGlobal and Wasalt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#171A1F] hover:bg-[#20242B] text-[#9A968C] hover:text-ivory-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#14161A] border-b border-[#1E2228] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Source Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#7A776F]">Developer:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-[#181B20] border border-[#272C35] rounded-lg px-3 py-1.5 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
              >
                <option value="all">All Developers</option>
                <option value="DarGlobal">DarGlobal</option>
                <option value="Wasalt">Wasalt</option>
              </select>
            </div>

            {/* Country Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#7A776F]">Location:</span>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-[#181B20] border border-[#272C35] rounded-lg px-3 py-1.5 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
              >
                <option value="all">All Countries</option>
                <option value="UAE">United Arab Emirates</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Oman">Oman</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Spain">Spain</option>
              </select>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm relative">
            <input
              type="text"
              placeholder="Search projects by name, brand, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#181B20] border border-[#272C35] rounded-xl pl-9 pr-3 py-1.5 text-xs text-ivory-100 placeholder-[#6B6861] focus:outline-none focus:border-gold-500/60"
            />
            <Search className="w-3.5 h-3.5 text-[#6B6861] absolute left-3 top-2.5" />
          </form>
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-gold-400">
              Loading developments...
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-xs text-[#716E66] space-y-2">
              <Building2 className="w-8 h-8 text-[#2F343E]" />
              <span>No developments match your current filters.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-[#15171C] border border-[#232730] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-gold-500/40 transition-all duration-300 group shadow-md"
                >
                  <div>
                    {/* Project Development Image (16:9) */}
                    <div className="w-full aspect-video relative overflow-hidden bg-[#101215]">
                      <SafeImage
                        src={getProjectImage(proj)}
                        alt={proj.name}
                        aspectRatio="aspect-video"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
                      />
                      {/* Top Badges */}
                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-none">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0B0D0E]/85 backdrop-blur-md text-gold-300 border border-gold-500/30">
                          {proj.source}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0B0D0E]/85 backdrop-blur-md text-ivory-200 border border-[#2A2E38]">
                          {proj.country || 'International'}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#15171C] to-transparent pointer-events-none" />
                    </div>

                    {/* Content Section */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-base font-semibold text-ivory-100 group-hover:text-gold-200 transition-colors">
                          {proj.name}
                        </h3>
                        {proj.starting_price && (
                          <span className="text-xs font-semibold text-gold-300 shrink-0">
                            From {proj.starting_price >= 1000000 ? `${(proj.starting_price / 1000000).toFixed(2)}M` : proj.starting_price.toLocaleString()} {proj.currency || 'SAR'}
                          </span>
                        )}
                      </div>

                      {proj.luxury_brand && (
                        <div className="text-xs text-gold-300/90 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-gold-400" />
                          <span>Brand: {proj.luxury_brand}</span>
                        </div>
                      )}

                      <p className="text-xs text-[#8A877E] line-clamp-2 leading-relaxed">
                        {proj.description || 'Exclusive luxury real estate development project.'}
                      </p>

                      {proj.total_units && (
                        <div className="text-[11px] text-[#6E6B63] font-medium">
                          Units: <span className="text-ivory-200">{proj.total_units} available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="px-4 py-3 bg-[#111317] border-t border-[#1F232A] flex items-center justify-between text-xs">
                    <span className="text-[#6D6B63] truncate max-w-[200px]">
                      📍 {proj.city || proj.location || 'Location upon request'}
                    </span>
                    <a
                      href={proj.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium group/btn shrink-0"
                    >
                      <span>View Project</span>
                      <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
