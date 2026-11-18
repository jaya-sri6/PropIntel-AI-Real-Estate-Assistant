export interface SourceCitation {
  title: string;
  source: string;
  url: string;
  relevance_score?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  timestamp: string;
}

export interface Property {
  id: number;
  source: string;
  title: string;
  property_type?: string;
  sale_or_rent?: string;
  location?: string;
  city?: string;
  district?: string;
  price?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  area_unit?: string;
  description?: string;
  amenities: string[];
  source_url: string;
  scraped_at?: string;
}

export interface Project {
  id: number;
  source: string;
  name: string;
  description?: string;
  country?: string;
  city?: string;
  location?: string;
  property_category?: string;
  development_type?: string;
  luxury_brand?: string;
  status?: string;
  completion_date?: string;
  total_units?: number;
  starting_price?: number;
  currency?: string;
  amenities: string[];
  official_url: string;
  scraped_at?: string;
}

export interface AdminStats {
  total_records: number;
  darglobal_record_count: number;
  wasalt_record_count: number;
  properties_count: number;
  projects_count: number;
  indexed_document_count: number;
  indexed_chunks_count: number;
  last_scraping_timestamp?: string;
  scraping_status: string;
  recent_errors: string[];
}
