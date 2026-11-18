import React, { useState, useEffect } from 'react';
import { X, Search, Filter, ExternalLink, Building2, Home, MapPin, Tag } from 'lucide-react';
import { Property, Project } from '../types';
import { api } from '../services/api';

interface DataExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataExplorerModal: React.FC<DataExplorerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'properties'>('projects');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen, activeTab, sourceFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'projects') {
        const params: Record<string, string> = { limit: '50' };
        if (sourceFilter !== 'all') params.source = sourceFilter;
        if (search) params.search = search;
        const res = await api.fetchProjects(params);
        setProjects(res.items);
      } else {
        const params: Record<string, string> = { limit: '50' };
        if (sourceFilter !== 'all') params.source = sourceFilter;
        if (search) params.search = search;
        const res = await api.fetchProperties(params);
        setProperties(res.items);
      }
    } catch (err) {
      console.error('Failed to load data explorer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[85vh] bg-[#101215] border border-[#22262E] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#1A1D22] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-ivory-50">Data Explorer</h2>
            <p className="text-xs text-[#827F77] mt-0.5">Explore structured records collected across DarGlobal and Wasalt</p>
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
          {/* Tabs: Projects vs Properties */}
          <div className="flex bg-[#0D0F11] p-1 rounded-xl border border-[#20242C]">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'projects'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                  : 'text-[#8E8B82] hover:text-ivory-100'
              }`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'properties'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                  : 'text-[#8E8B82] hover:text-ivory-100'
              }`}
            >
              Properties ({properties.length})
            </button>
          </div>

          {/* Source Filter Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#7A776F]">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-[#181B20] border border-[#272C35] rounded-lg px-3 py-1.5 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
            >
              <option value="all">All Sources</option>
              <option value="DarGlobal">DarGlobal</option>
              <option value="Wasalt">Wasalt</option>
            </select>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm relative">
            <input
              type="text"
              placeholder="Search by keyword, city, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#181B20] border border-[#272C35] rounded-xl pl-9 pr-3 py-1.5 text-xs text-ivory-100 placeholder-[#6B6861] focus:outline-none focus:border-gold-500/60"
            />
            <Search className="w-3.5 h-3.5 text-[#6B6861] absolute left-3 top-2.5" />
          </form>
        </div>

        {/* Content Table / Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-gold-400">
              Loading real estate records...
            </div>
          ) : activeTab === 'projects' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-[#15171C] border border-[#232730] rounded-2xl p-4 flex flex-col justify-between hover:border-gold-500/30 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gold-500/10 text-gold-400 border border-gold-500/20">
                        {proj.source}
                      </span>
                      <span className="text-[11px] text-[#716E66]">{proj.country || 'International'}</span>
                    </div>
                    <h3 className="font-serif text-base font-semibold text-ivory-100">{proj.name}</h3>
                    {proj.luxury_brand && (
                      <div className="text-xs text-gold-300/90 font-medium mt-0.5">
                        Brand: {proj.luxury_brand}
                      </div>
                    )}
                    <p className="text-xs text-[#8A877E] mt-2 line-clamp-3 leading-relaxed">
                      {proj.description || 'No description available.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1F232A] flex items-center justify-between text-xs">
                    <span className="text-[#6D6B63]">📍 {proj.city || proj.location || 'Location upon request'}</span>
                    <a
                      href={proj.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium"
                    >
                      <span>View Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map((prop) => (
                <div key={prop.id} className="bg-[#15171C] border border-[#232730] rounded-2xl p-4 flex flex-col justify-between hover:border-gold-500/30 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {prop.source}
                      </span>
                      <span className="text-xs font-serif font-bold text-gold-300">
                        {prop.price ? `${prop.price.toLocaleString()} ${prop.currency || 'SAR'}` : 'Price on Inquiry'}
                      </span>
                    </div>
                    <h3 className="font-serif text-sm font-semibold text-ivory-100">{prop.title}</h3>
                    <div className="flex flex-wrap gap-2 text-[11px] text-[#86837A] mt-2">
                      {prop.bedrooms && <span>🛏️ {prop.bedrooms} Beds</span>}
                      {prop.bathrooms && <span>🛁 {prop.bathrooms} Baths</span>}
                      {prop.area && <span>📐 {prop.area} {prop.area_unit || 'SQM'}</span>}
                      {prop.property_type && <span>🏷️ {prop.property_type}</span>}
                    </div>
                    <p className="text-xs text-[#8A877E] mt-2 line-clamp-2 leading-relaxed">
                      {prop.description || prop.location}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1F232A] flex items-center justify-between text-xs">
                    <span className="text-[#6D6B63]">📍 {prop.district ? `${prop.district}, ${prop.city}` : prop.location}</span>
                    <a
                      href={prop.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium"
                    >
                      <span>Listing Link</span>
                      <ExternalLink className="w-3 h-3" />
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
