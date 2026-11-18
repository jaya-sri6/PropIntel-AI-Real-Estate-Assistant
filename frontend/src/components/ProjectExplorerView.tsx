import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Building2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';
import { SafeImage } from './SafeImage';
import { getProjectImage } from '../utils/imageHelper';

interface ProjectExplorerViewProps {
  onBackToChat?: () => void;
}

export const ProjectExplorerView: React.FC<ProjectExplorerViewProps> = ({ onBackToChat }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadProjects();
  }, [sourceFilter, countryFilter, statusFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '80' };
      if (sourceFilter !== 'all') params.source = sourceFilter;
      if (countryFilter !== 'all') params.country = countryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.fetchProjects(params);
      let items = res.items || [];

      // If status filter is applied on client side if not in backend
      if (statusFilter !== 'all') {
        items = items.filter((p) => (p.status || '').toLowerCase().includes(statusFilter.toLowerCase()));
      }

      setProjects(items);

      // Default selected project: The Opus or first item
      if (items.length > 0) {
        const opus = items.find((p) => p.name.toLowerCase().includes('opus'));
        setSelectedProject(opus || items[0]);
        setActiveThumbnailIndex(0);
      }
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

  // Get gallery thumbnails for the selected project
  const getGalleryForProject = (p: Project | null): string[] => {
    if (!p) return ['/images/opus-featured.jpg'];
    const name = (p.name || '').toLowerCase();
    if (name.includes('opus')) {
      return [
        '/images/opus-featured.jpg',
        '/images/project-thumb-1.jpg',
        '/images/project-thumb-2.jpg',
        '/images/project-thumb-3.jpg'
      ];
    }
    if (name.includes('pagani')) {
      return [
        '/images/featured-pagani.jpg',
        '/images/branded-residence.jpg',
        '/images/dubai-skyline.jpg',
        '/images/project-thumb-1.jpg'
      ];
    }
    const baseImg = getProjectImage(p);
    return [baseImg, '/images/project-thumb-1.jpg', '/images/project-thumb-2.jpg', '/images/project-thumb-3.jpg'];
  };

  const activeGallery = getGalleryForProject(selectedProject);

  const handleNextProject = () => {
    if (!projects.length || !selectedProject) return;
    const currentIndex = projects.findIndex((p) => p.id === selectedProject.id);
    const nextIndex = (currentIndex + 1) % projects.length;
    setSelectedProject(projects[nextIndex]);
    setActiveThumbnailIndex(0);
  };

  const handlePrevProject = () => {
    if (!projects.length || !selectedProject) return;
    const currentIndex = projects.findIndex((p) => p.id === selectedProject.id);
    const prevIndex = (currentIndex - 1 + projects.length) % projects.length;
    setSelectedProject(projects[prevIndex]);
    setActiveThumbnailIndex(0);
  };

  return (
    <div className="flex-1 h-full bg-[#07080A] relative overflow-y-auto flex flex-col justify-between p-6 md:p-10 select-none">
      {/* Top-Right Decorative Skyline Header Image */}
      <div
        className="absolute top-0 right-0 w-1/3 h-56 bg-cover bg-no-repeat pointer-events-none opacity-40 mix-blend-screen"
        style={{
          backgroundImage: "url('/images/project-explorer-header.jpg')",
          backgroundPosition: 'top right'
        }}
      />
      <div className="absolute top-0 right-0 w-1/3 h-56 bg-gradient-to-l from-transparent via-[#07080A]/60 to-[#07080A] pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/3 h-56 bg-gradient-to-b from-transparent to-[#07080A] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-ivory-50 tracking-tight">
            Project Explorer
          </h1>
          <p className="text-xs md:text-sm text-[#939087] mt-1 font-sans">
            Discover major developments and projects
          </p>
        </div>

        {/* Search & Capsule Filters Row (Matching Reference) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Pill Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-[#75726B] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#121417] border border-[#22262E] focus:border-gold-500/50 text-xs md:text-sm text-ivory-100 placeholder-[#6A6760] focus:outline-none transition-all shadow-inner"
            />
          </form>

          {/* Filter Capsule Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* All Sources */}
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-full bg-[#121417] border border-[#22262E] hover:border-gold-500/30 text-xs text-ivory-100 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="all">All Sources</option>
                <option value="DarGlobal">DarGlobal</option>
                <option value="Wasalt">Wasalt</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#7A776F] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* All Countries */}
            <div className="relative">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-full bg-[#121417] border border-[#22262E] hover:border-gold-500/30 text-xs text-ivory-100 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="all">All Countries</option>
                <option value="UAE">UAE</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Oman">Oman</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Spain">Spain</option>
                <option value="Qatar">Qatar</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#7A776F] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* All Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-full bg-[#121417] border border-[#22262E] hover:border-gold-500/30 text-xs text-ivory-100 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Off-plan">Off-plan</option>
                <option value="Available">Available</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#7A776F] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Master Showcase Section (Split 2 Columns: Left Photo Gallery, Right Details Card) */}
        {selectedProject ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-start">
            {/* Left Column: Big Featured Image + Multi-Angle Thumbnail Strip (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              {/* Main Featured Photo */}
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#22262E] bg-[#121417] shadow-2xl group">
                <SafeImage
                  src={activeGallery[activeThumbnailIndex] || activeGallery[0]}
                  alt={selectedProject.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  fallbackSrc="/images/branded-residence.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Developer Tag Overlay */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-ivory-100 font-medium">
                  {selectedProject.source}
                </div>

                {/* Quick Next/Prev controls */}
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handlePrevProject}
                    className="p-1.5 rounded-full bg-black/70 hover:bg-black text-ivory-100 backdrop-blur-md transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextProject}
                    className="p-1.5 rounded-full bg-black/70 hover:bg-black text-ivory-100 backdrop-blur-md transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Strip (3-4 shots below main photo) */}
              <div className="grid grid-cols-3 gap-2.5">
                {activeGallery.slice(1, 4).map((thumb, idx) => {
                  const actualIdx = idx + 1;
                  const isSelected = activeThumbnailIndex === actualIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveThumbnailIndex(actualIdx)}
                      className={`relative aspect-[16/9] rounded-xl overflow-hidden border transition-all ${
                        isSelected
                          ? 'border-gold-400 ring-2 ring-gold-400/40 scale-[1.02]'
                          : 'border-[#22262E] hover:border-gold-500/40 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <SafeImage
                        src={thumb}
                        alt={`View ${idx + 1}`}
                        className="w-full h-full object-cover"
                        fallbackSrc="/images/project-thumb-1.jpg"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Project Specification Card (7 Cols) */}
            <div className="lg:col-span-7 bg-[#121417]/85 border border-[#22262E] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl backdrop-blur-md min-h-[360px]">
              <div className="space-y-4">
                {/* Title & Developer Pill */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-ivory-50 tracking-tight">
                    {selectedProject.name}
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-300 text-xs font-medium">
                    {selectedProject.source}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center space-x-2 text-xs md:text-sm text-[#9A968C]">
                  <MapPin className="w-4 h-4 text-gold-400 shrink-0" />
                  <span>
                    {selectedProject.location || `${selectedProject.city || ''}, ${selectedProject.country || ''}`}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs md:text-sm text-[#9A968C] leading-relaxed">
                  {selectedProject.description ||
                    `A prestigious master development featuring ultra-luxury architecture, curated residences, and world-class hospitality amenities.`}
                </p>

                {/* Feature Tags Row */}
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#181B20] border border-[#272C35] text-xs text-ivory-100">
                    <Building2 className="w-3.5 h-3.5 text-gold-400" />
                    <span>Luxury Residences</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#181B20] border border-[#272C35] text-xs text-ivory-100">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                    <span>Premium Amenities</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#181B20] border border-[#272C35] text-xs text-ivory-100">
                    <Compass className="w-3.5 h-3.5 text-gold-400" />
                    <span>Iconic Design</span>
                  </div>
                </div>

                {/* Highlight Bullets */}
                <div className="space-y-2 pt-2 border-t border-[#1C2026] text-xs text-[#8A877E]">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                    <span>
                      {selectedProject.luxury_brand
                        ? `Branded Collaboration with ${selectedProject.luxury_brand}`
                        : 'Curated architectural craftsmanship and bespoke finishes'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                    <span>
                      {selectedProject.status
                        ? `Status: ${selectedProject.status} • World-class private concierge`
                        : 'Full residential amenities, private lounge, and wellness facilities'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: View Full Details */}
              <div className="pt-6 flex items-center justify-end">
                <a
                  href={selectedProject.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl border border-gold-500/40 hover:border-gold-500 text-gold-300 hover:text-ivory-100 hover:bg-gold-500/10 text-xs font-medium flex items-center space-x-2 transition-all group"
                >
                  <span>View Full Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-[#75726B] text-sm">
            No projects match the selected criteria.
          </div>
        )}

        {/* Project Selector Catalog Row (Horizontal Browse Strip) */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#7A776F]">
            <span className="font-medium text-ivory-100">
              All Developments ({projects.length})
            </span>
            <span>Click any project to inspect details</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {projects.slice(0, 15).map((p) => {
              const isSelected = selectedProject?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProject(p);
                    setActiveThumbnailIndex(0);
                  }}
                  className={`flex-shrink-0 w-48 p-2.5 rounded-2xl bg-[#121417] border transition-all text-left group ${
                    isSelected
                      ? 'border-gold-400/60 ring-1 ring-gold-400/30 bg-[#16181C]'
                      : 'border-[#22262E] hover:border-gold-500/40'
                  }`}
                >
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-black/40 mb-2">
                    <SafeImage
                      src={getProjectImage(p)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackSrc="/images/branded-residence.jpg"
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-ivory-100">
                      {p.source}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-ivory-100 truncate group-hover:text-gold-300 transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-[#7A776F] truncate mt-0.5">
                    {p.city || p.country}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
