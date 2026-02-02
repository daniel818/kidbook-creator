export interface FAQ {
  id: string;
  question: string;
  answer: string;
  relatedFaqs?: string[];
}

export interface FAQCategory {
  id: string;
  title: string;
  faqs: FAQ[];
}

export interface FAQData {
  meta: {
    title: string;
    description: string;
  };
  heading: string;
  searchPlaceholder: string;
  noResults: string;
  relatedQuestions: string;
  stillHaveQuestions: string;
  contactDescription: string;
  contactSupport: string;
  categories: FAQCategory[];
}
