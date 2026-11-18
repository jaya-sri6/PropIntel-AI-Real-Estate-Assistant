import React, { useState, useEffect } from 'react';
import { X, Search, Filter, ExternalLink, Home, MapPin, Tag } from 'lucide-react';
import { Property } from '../types';
import { api } from '../services/api';
import { SafeImage } from './SafeImage';
import { getPropertyImage } from '../utils/imageHelper';

interface DataExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataExplorerModal: React.FC<DataExplorerModalProps> = ({ isOpen, onClose }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const [saleOrRent, setSaleOrRent] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadProperties();
    }
  }, [isOpen, sourceFilter, propertyType, saleOrRent]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '80' };
      if (sourceFilter !== 'all') params.source = sourceFilter;
      if (propertyType !== 'all') params.property_type = propertyType;
      if (saleOrRent !== 'all') params.sale_or_rent = saleOrRent;
      if (search.trim()) params.search = search.trim();

      const res = await api.fetchProperties(params);
      setProperties(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProperties();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[85vh] bg-[#101215] border border-[#22262E] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#1A1D22] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-ivory-50">Data Explorer</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                  {total} Properties
                </span>
              </div>
              <p className="text-xs text-[#827F77] mt-0.5">
                Explore verified property listings, luxury villas, and apartments across Wasalt and DarGlobal
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
              <span className="text-xs text-[#7A776F]">Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-[#181B20] border border-[#272C35] rounded-lg px-3 py-1.5 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
              >
                <option value="all">All Sources</option>
                <option value="Wasalt">Wasalt</option>
                <option value="DarGlobal">DarGlobal</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#7A776F]">Type:</span>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="bg-[#181B20] border border-[#272C35] rounded-lg px-3 py-1.5 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
              >
                <option value="all">All Types</option>
                <option value="Villa">Villas & Townhouses</option>
                <option value="Apartment">Apartments</option>
              </select>
            </div>

            {/* Sale / Rent Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#7A776F]">Purpose:</span>
              <select
                value={saleOrRent}
                onChange={(e) => setSaleOrRent(e.target.value)}
                className="bg-[#181B20] border border-[#272C35] rounded-lg px-3 py-1.5 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
              >
                <option value="all">All Purposes</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm relative">
            <input
              type="text"
              placeholder="Search by district, title, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#181B20] border border-[#272C35] rounded-xl pl-9 pr-3 py-1.5 text-xs text-ivory-100 placeholder-[#6B6861] focus:outline-none focus:border-gold-500/60"
            />
            <Search className="w-3.5 h-3.5 text-[#6B6861] absolute left-3 top-2.5" />
          </form>
        </div>

        {/* Properties Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-gold-400">
              Loading properties...
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-xs text-[#716E66] space-y-2">
              <Home className="w-8 h-8 text-[#2F343E]" />
              <span>No properties match your current filters.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-[#15171C] border border-[#232730] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-gold-500/40 transition-all duration-300 group shadow-md"
                >
                  <div>
                    {/* Property Listing Image (16:9) */}
                    <div className="w-full aspect-video relative overflow-hidden bg-[#101215]">
                      <SafeImage
                        src={getPropertyImage(prop)}
                        alt={prop.title}
                        aspectRatio="aspect-video"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
                      />
                      {/* Top Badges */}
                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-none">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0B0D0E]/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                          {prop.source}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0B0D0E]/85 backdrop-blur-md text-gold-300 border border-gold-500/30">
                          {prop.price ? `${prop.price.toLocaleString()} ${prop.currency || 'SAR'}` : 'Price on Inquiry'}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#15171C] to-transparent pointer-events-none" />
                    </div>

                    {/* Content Section */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-serif text-sm font-semibold text-ivory-100 group-hover:text-gold-200 transition-colors">
                        {prop.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-[11px] text-[#86837A]">
                        {prop.bedrooms && <span>🛏️ {prop.bedrooms} Beds</span>}
                        {prop.bathrooms && <span>🛁 {prop.bathrooms} Baths</span>}
                        {prop.area && <span>📐 {prop.area} {prop.area_unit || 'SQM'}</span>}
                        {prop.property_type && (
                          <span className="px-1.5 py-0.5 rounded bg-[#1C1F26] text-[#9A968C] border border-[#282D37]">
                            {prop.property_type}
                          </span>
                        )}
                        {prop.sale_or_rent && (
                          <span className="capitalize px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold-500/20">
                            {prop.sale_or_rent}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8A877E] line-clamp-2 leading-relaxed">
                        {prop.description || prop.location}
                      </p>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="px-4 py-3 bg-[#111317] border-t border-[#1F232A] flex items-center justify-between text-xs">
                    <span className="text-[#6D6B63] truncate max-w-[200px]">
                      📍 {prop.district ? `${prop.district}, ${prop.city}` : prop.location}
                    </span>
                    <a
                      href={prop.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium group/btn shrink-0"
                    >
                      <span>View Details</span>
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
