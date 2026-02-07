// ============================================
// Story Templates - Type Definitions
// ============================================

export type TemplateAudience = 'baby' | 'preschool' | 'early_reader' | 'older_kids' | 'adults';

export type TemplateCategory =
  | 'bedtime' | 'adventure' | 'fantasy' | 'animals' | 'family'
  | 'holidays' | 'milestones' | 'educational' | 'emotions' | 'humor'
  | 'romance' | 'careers' | 'sports' | 'cultural';

export interface StoryTemplate {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  audience: TemplateAudience;
  ageMin: number;
  ageMax: number;
  category: TemplateCategory;
  tags: string[];
  pageCount: number;
  artStyle: string | null;
  popularityScore: number;
  isFeatured: boolean;
  isNew: boolean;
  highlights?: string[];
  samplePages?: string[];
}

export interface CategoryRowData {
  title: string;
  icon: string;
  filterParams: string;
  templates: StoryTemplate[];
}

// Audience display info
export const AudienceInfo: Record<TemplateAudience, {
  label: string;
  ageLabel: string;
  icon: string;
}> = {
  baby: { label: 'Baby & Toddler', ageLabel: 'Ages 0–2', icon: '👶' },
  preschool: { label: 'Preschool', ageLabel: 'Ages 3–4', icon: '🧒' },
  early_reader: { label: 'Early Reader', ageLabel: 'Ages 5–6', icon: '📖' },
  older_kids: { label: 'Older Kids', ageLabel: 'Ages 7–12', icon: '🎒' },
  adults: { label: 'Adults', ageLabel: 'Adults', icon: '💕' },
};

// Category display info
export const CategoryInfo: Record<TemplateCategory, {
  label: string;
  icon: string;
  colors: [string, string];
}> = {
  bedtime: { label: 'Bedtime', icon: '🌙', colors: ['#6366f1', '#8b5cf6'] },
  adventure: { label: 'Adventure', icon: '🚀', colors: ['#f97316', '#eab308'] },
  fantasy: { label: 'Fantasy & Magic', icon: '🦄', colors: ['#ec4899', '#a855f7'] },
  animals: { label: 'Animals & Nature', icon: '🦁', colors: ['#f59e0b', '#84cc16'] },
  family: { label: 'Family & Love', icon: '👨‍👩‍👧', colors: ['#f472b6', '#fb7185'] },
  holidays: { label: 'Holidays', icon: '🎄', colors: ['#ef4444', '#10b981'] },
  milestones: { label: 'Milestones & Firsts', icon: '🎒', colors: ['#06b6d4', '#6366f1'] },
  educational: { label: 'Learning & STEM', icon: '📚', colors: ['#10b981', '#06b6d4'] },
  emotions: { label: 'Feelings & Social', icon: '💛', colors: ['#fbbf24', '#f97316'] },
  humor: { label: 'Humor & Fun', icon: '😂', colors: ['#f97316', '#ec4899'] },
  romance: { label: 'Romance & Love', icon: '❤️', colors: ['#ef4444', '#ec4899'] },
  careers: { label: 'Careers & Jobs', icon: '👩‍🚒', colors: ['#3b82f6', '#6366f1'] },
  sports: { label: 'Sports', icon: '⚽', colors: ['#10b981', '#3b82f6'] },
  cultural: { label: 'Cultural & Heritage', icon: '🕎', colors: ['#8b5cf6', '#6366f1'] },
};

// Category rows configuration for the bookshelf view
export const CATEGORY_ROWS = [
  { title: '✨ Popular Stories', icon: '✨', filterParams: 'featured=true&limit=10' },
  { title: '🌙 Bedtime Stories', icon: '🌙', filterParams: 'category=bedtime&limit=10' },
  { title: '🦁 Animal Adventures', icon: '🦁', filterParams: 'category=animals&limit=10' },
  { title: '🎒 Milestones & Firsts', icon: '🎒', filterParams: 'category=milestones&limit=10' },
  { title: '🚀 Adventure & Fantasy', icon: '🚀', filterParams: 'category=adventure&limit=10' },
  { title: '👨‍👩‍👧 Family & Emotions', icon: '👨‍👩‍👧', filterParams: 'category=family&limit=10' },
  { title: '📚 Learning & STEM', icon: '📚', filterParams: 'category=educational&limit=10' },
  { title: '🎄 Holidays & Celebrations', icon: '🎄', filterParams: 'category=holidays&limit=10' },
  { title: '💕 For Adults', icon: '💕', filterParams: 'audience=adults&limit=10' },
  { title: '🆕 New Arrivals', icon: '🆕', filterParams: 'sort=newest&limit=10' },
];

// Helper: build age label from min/max
export function getAgeLabel(ageMin: number, ageMax: number): string {
  if (ageMin >= 18) return 'Adults';
  if (ageMin === ageMax) return `Age ${ageMin}`;
  return `Ages ${ageMin}–${ageMax}`;
}

// Helper: map DB row to StoryTemplate
export function mapDbRowToTemplate(row: Record<string, unknown>, locale: string = 'en'): StoryTemplate {
  const title = row.title as Record<string, string>;
  const description = row.description as Record<string, string> | null;
  const highlights = row.highlights as Record<string, string[]> | null;

  return {
    id: row.id as string,
    slug: row.slug as string,
    title: title?.[locale] || title?.['en'] || '',
    description: description?.[locale] || description?.['en'] || '',
    coverImageUrl: (row.cover_image_url as string) || null,
    audience: row.audience as TemplateAudience,
    ageMin: row.age_min as number,
    ageMax: row.age_max as number,
    category: row.category as TemplateCategory,
    tags: (row.tags as string[]) || [],
    pageCount: row.page_count as number,
    artStyle: (row.art_style as string) || null,
    popularityScore: row.popularity_score as number,
    isFeatured: row.is_featured as boolean,
    isNew: row.is_new as boolean,
    highlights: highlights?.[locale] || highlights?.['en'],
    samplePages: (row.sample_pages as string[]) || [],
  };
}
