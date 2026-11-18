import { Project, Property } from '../types';

/**
 * Returns an authentic property or development image based on project metadata.
 * Uses specific authentic architectural images for known projects and categorized luxury imagery.
 */
export const getProjectImage = (project: Project): string => {
  const name = (project.name || '').toLowerCase();
  const desc = (project.description || '').toLowerCase();
  const brand = (project.luxury_brand || '').toLowerCase();

  if (name.includes('opus')) {
    return '/images/opus-featured.jpg';
  }
  if (name.includes('pagani') || brand.includes('pagani')) {
    return '/images/featured-pagani.jpg';
  }
  if (name.includes('urban oasis') || name.includes('missoni') || brand.includes('missoni')) {
    return '/images/branded-residence.jpg';
  }
  if (name.includes('trump') || brand.includes('trump') || name.includes('astera') || brand.includes('aston martin')) {
    return '/images/featured-pagani.jpg';
  }
  if (name.includes('neptune') || name.includes('etoile') || name.includes('elie saab') || brand.includes('mouawad')) {
    return '/images/featured-pagani.jpg';
  }
  if (name.includes('retal') || name.includes('khozama') || name.includes('sedra') || name.includes('diyar') || name.includes('durrat') || name.includes('shams')) {
    return '/images/project-community.jpg';
  }
  if (project.source === 'Wasalt') {
    if (name.includes('villa') || desc.includes('villa') || name.includes('darwaza') || name.includes('rafia')) {
      return project.id % 2 === 0 ? '/images/villa-luxury.jpg' : '/images/villa-riyadh.jpg';
    }
    if (name.includes('apartment') || name.includes('floors') || name.includes('residence') || name.includes('curio')) {
      return '/images/apartment-modern.jpg';
    }
    return '/images/project-community.jpg';
  }

  // Default DarGlobal luxury project image
  return '/images/branded-residence.jpg';
};

/**
 * Returns an authentic property image based on listing type (villa, apartment, community).
 */
export const getPropertyImage = (property: Property): string => {
  const pType = (property.property_type || '').toLowerCase();
  const title = (property.title || '').toLowerCase();

  if (pType.includes('villa') || title.includes('villa')) {
    // Alternate based on property id to provide authentic variety
    return property.id % 2 === 0 ? '/images/villa-riyadh.jpg' : '/images/villa-luxury.jpg';
  }
  if (pType.includes('apartment') || title.includes('apartment')) {
    return '/images/apartment-modern.jpg';
  }

  return '/images/project-community.jpg';
};
