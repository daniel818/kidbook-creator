// Prompt Templates Index - Language Selection

import * as en from './en';
import * as de from './de';
import * as he from './he';

export type Language = 'en' | 'de' | 'he';

const prompts = {
    en,
    de,
    he
};

export const getPrompts = (language: Language = 'en') => {
    return prompts[language] || prompts.en;
};
