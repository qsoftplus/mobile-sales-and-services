// Export all templates
export { ModernMinimalTemplate } from './modern-minimal'
export { CorporateBlueTemplate } from './corporate-blue'
export { DarkHeaderTemplate } from './dark-header'
export { CreativeSidebarTemplate } from './creative-sidebar'
export { ExecutivePlatinumTemplate } from './executive-platinum'
export { TechMinimalistTemplate } from './tech-minimalist'
export { VintageCraftTemplate } from './vintage-craft'
export { BoldModernTemplate } from './bold-modern'
export { LuxuryBoutiqueTemplate } from './luxury-boutique'
export { IndustrialModernTemplate } from './industrial-modern'

// Template component map for dynamic rendering
import { ModernMinimalTemplate } from './modern-minimal'
import { CorporateBlueTemplate } from './corporate-blue'
import { DarkHeaderTemplate } from './dark-header'
import { CreativeSidebarTemplate } from './creative-sidebar'
import { ExecutivePlatinumTemplate } from './executive-platinum'
import { TechMinimalistTemplate } from './tech-minimalist'
import { VintageCraftTemplate } from './vintage-craft'
import { BoldModernTemplate } from './bold-modern'
import { LuxuryBoutiqueTemplate } from './luxury-boutique'
import { IndustrialModernTemplate } from './industrial-modern'
import { TemplateId, InvoiceData } from '../types'
import { FC } from 'react'

type TemplateComponent = FC<{ data: InvoiceData }>

export const templateComponents: Record<TemplateId, TemplateComponent> = {
  'modern-minimal': ModernMinimalTemplate,
  'corporate-blue': CorporateBlueTemplate,
  'dark-header': DarkHeaderTemplate,
  'creative-sidebar': CreativeSidebarTemplate,
  'elegant-serif': ExecutivePlatinumTemplate,
  'tech-gradient': TechMinimalistTemplate,
  'compact-grid': VintageCraftTemplate,
  'brand-focus': BoldModernTemplate,
  'monochrome': LuxuryBoutiqueTemplate,
  'retail-receipt': IndustrialModernTemplate,
}

export const getTemplateComponent = (id: TemplateId): TemplateComponent => {
  return templateComponents[id] || ModernMinimalTemplate
}
