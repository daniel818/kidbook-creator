import { FAQ, FAQCategory } from './types';

/**
 * Search FAQs by query string
 * Searches both question and answer text
 */
export function searchFAQs(
  categories: FAQCategory[],
  query: string
): FAQCategory[] {
  if (!query.trim()) {
    return categories;
  }

  const lowerQuery = query.toLowerCase();

  return categories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(lowerQuery) ||
          faq.answer.toLowerCase().includes(lowerQuery)
      ),
    }))
    .filter((category) => category.faqs.length > 0);
}

/**
 * Find FAQ by ID across all categories
 */
export function findFAQById(
  categories: FAQCategory[],
  id: string
): FAQ | undefined {
  for (const category of categories) {
    const faq = category.faqs.find((f) => f.id === id);
    if (faq) return faq;
  }
  return undefined;
}

/**
 * Get related FAQs by IDs
 */
export function getRelatedFAQs(
  categories: FAQCategory[],
  relatedIds: string[]
): FAQ[] {
  return relatedIds
    .map((id) => findFAQById(categories, id))
    .filter((faq): faq is FAQ => faq !== undefined);
}

/**
 * Highlight search terms in text
 */
export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate anchor ID from FAQ ID
 */
export function generateAnchorId(faqId: string): string {
  return `faq-${faqId}`;
}

/**
 * Scroll to FAQ by ID
 */
export function scrollToFAQ(faqId: string): void {
  if (typeof window === 'undefined') return;
  const element = document.getElementById(generateAnchorId(faqId));
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
