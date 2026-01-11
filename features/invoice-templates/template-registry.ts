import { TemplateInfo, TemplateId } from './types'

// Template registry with metadata for all available templates
export const templateRegistry: Record<TemplateId, TemplateInfo> = {
  'modern-minimal': {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean design with plenty of whitespace and modern typography',
    thumbnail: '/templates/modern-minimal.png',
    primaryColor: '#0f172a',
    secondaryColor: '#64748b',
    style: 'minimal',
  },
  'corporate-blue': {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional blue theme perfect for business invoices',
    thumbnail: '/templates/corporate-blue.png',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    style: 'classic',
  },
  'dark-header': {
    id: 'dark-header',
    name: 'Dark Header Bold',
    description: 'Eye-catching dark header with bold typography',
    thumbnail: '/templates/dark-header.png',
    primaryColor: '#18181b',
    secondaryColor: '#f59e0b',
    style: 'bold',
  },
  'creative-sidebar': {
    id: 'creative-sidebar',
    name: 'Creative Sidebar',
    description: 'Unique layout with colored sidebar for branding',
    thumbnail: '/templates/creative-sidebar.png',
    primaryColor: '#7c3aed',
    secondaryColor: '#a78bfa',
    style: 'creative',
  },
  'elegant-serif': {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    description: 'Classic serif fonts for a luxury premium feel',
    thumbnail: '/templates/elegant-serif.png',
    primaryColor: '#1c1917',
    secondaryColor: '#78716c',
    style: 'classic',
  },
  'tech-gradient': {
    id: 'tech-gradient',
    name: 'Tech Gradient',
    description: 'Modern gradient accents for tech-savvy businesses',
    thumbnail: '/templates/tech-gradient.png',
    primaryColor: '#0891b2',
    secondaryColor: '#06b6d4',
    style: 'modern',
  },
  'compact-grid': {
    id: 'compact-grid',
    name: 'Compact Grid',
    description: 'High-density layout maximizing information per page',
    thumbnail: '/templates/compact-grid.png',
    primaryColor: '#16a34a',
    secondaryColor: '#22c55e',
    style: 'modern',
  },
  'brand-focus': {
    id: 'brand-focus',
    name: 'Brand Focus',
    description: 'Large logo placement with brand-centric design',
    thumbnail: '/templates/brand-focus.png',
    primaryColor: '#dc2626',
    secondaryColor: '#f87171',
    style: 'bold',
  },
  'monochrome': {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Strict black and white with high contrast lines',
    thumbnail: '/templates/monochrome.png',
    primaryColor: '#000000',
    secondaryColor: '#525252',
    style: 'minimal',
  },
  'retail-receipt': {
    id: 'retail-receipt',
    name: 'Retail Receipt',
    description: 'Receipt-style layout adapted for service invoices',
    thumbnail: '/templates/retail-receipt.png',
    primaryColor: '#ea580c',
    secondaryColor: '#fb923c',
    style: 'creative',
  },
}

export const getTemplateInfo = (id: TemplateId): TemplateInfo => {
  return templateRegistry[id] || templateRegistry['modern-minimal']
}

export const getAllTemplates = (): TemplateInfo[] => {
  return Object.values(templateRegistry)
}

export const DEFAULT_TEMPLATE: TemplateId = 'modern-minimal'
