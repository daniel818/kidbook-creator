export const RTL_LANGUAGES = ['he', 'ar', 'fa', 'ur'];

export function isRTL(locale: string): boolean {
  return RTL_LANGUAGES.includes(locale);
}

export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}
