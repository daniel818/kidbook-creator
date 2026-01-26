// ============================================
// KIDBOOK CREATOR - Type Definitions
// ============================================

export type BookType = 'board' | 'picture' | 'story' | 'alphabet';

export type BookTheme = 'adventure' | 'bedtime' | 'learning' | 'fantasy' | 'animals' | 'custom';

export type AgeGroup = '0-2' | '3-5' | '6-8' | '9-12';

export interface BookSettings {
  childName: string;
  childAge: number;
  ageGroup: AgeGroup;
  bookType: BookType;
  bookTheme: BookTheme;
  title: string;
  storyDescription?: string;
  artStyle?: import('@/lib/art-styles').ArtStyle;
  imageQuality?: import('@/lib/art-styles').ImageQuality;
  printFormat?: 'square' | 'portrait';
  language?: 'en' | 'de' | 'he';
}

export interface TextElement {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  width: number;
}

export interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface BookPage {
  id: string;
  pageNumber: number;
  type: 'cover' | 'inside' | 'back';
  backgroundColor: string;
  backgroundImage?: string;
  textElements: TextElement[];
  imageElements: ImageElement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Book {
  id: string;
  settings: BookSettings;
  pages: BookPage[];
  status: 'draft' | 'completed' | 'ordered';
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string;
  estimatedCost?: number;
  language?: 'en' | 'de' | 'he';
}

export interface OrderDetails {
  bookId: string;
  format: 'softcover' | 'hardcover';
  size: '6x6' | '8x8' | '8x10';
  quantity: number;
  shippingAddress: ShippingAddress;
  totalPrice: number;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface Order {
  id: string;
  bookId: string;
  userId: string;
  details: OrderDetails;
  status: 'pending' | 'processing' | 'printed' | 'shipped' | 'delivered';
  trackingNumber?: string;
  luluOrderId?: string;
  stripePaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Book Type Display Info
export const BookTypeInfo: Record<BookType, {
  label: string;
  description: string;
  icon: string;
  color: string;
  ageRange: string;
}> = {
  board: {
    label: 'Board Book',
    description: 'Durable pages perfect for little hands',
    icon: '📘',
    color: '#10b981',
    ageRange: '0-3 years'
  },
  picture: {
    label: 'Picture Book',
    description: 'Beautiful illustrations with short text',
    icon: '🎨',
    color: '#6366f1',
    ageRange: '3-6 years'
  },
  story: {
    label: 'Story Book',
    description: 'Engaging stories for growing readers',
    icon: '📖',
    color: '#ec4899',
    ageRange: '5-10 years'
  },
  alphabet: {
    label: 'Alphabet Book',
    description: 'Learn letters in a fun way',
    icon: '🔤',
    color: '#f59e0b',
    ageRange: '2-5 years'
  }
};

export const BookThemeInfo: Record<BookTheme, {
  label: string;
  icon: string;
  colors: string[];
}> = {
  adventure: {
    label: 'Adventure',
    icon: '🏔️',
    colors: ['#f97316', '#eab308']
  },
  bedtime: {
    label: 'Bedtime',
    icon: '🌙',
    colors: ['#6366f1', '#8b5cf6']
  },
  learning: {
    label: 'Learning',
    icon: '📚',
    colors: ['#10b981', '#06b6d4']
  },
  fantasy: {
    label: 'Fantasy',
    icon: '🦄',
    colors: ['#ec4899', '#a855f7']
  },
  animals: {
    label: 'Animals',
    icon: '🦁',
    colors: ['#f59e0b', '#84cc16']
  },
  custom: {
    label: 'Custom',
    icon: '✨',
    colors: ['#6366f1', '#ec4899']
  }
};

// Helper to get age group from age
export function getAgeGroup(age: number): AgeGroup {
  if (age <= 2) return '0-2';
  if (age <= 5) return '3-5';
  if (age <= 8) return '6-8';
  return '9-12';
}

// Helper to create a new page
export function createNewPage(pageNumber: number, type: BookPage['type'] = 'inside'): BookPage {
  return {
    id: crypto.randomUUID(),
    pageNumber,
    type,
    backgroundColor: '#ffffff',
    textElements: [],
    imageElements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Helper to create a new book
export function createNewBook(settings: BookSettings): Book {
  const coverPage = createNewPage(0, 'cover');
  coverPage.textElements.push({
    id: crypto.randomUUID(),
    content: settings.title || `${settings.childName}'s Book`,
    x: 50,
    y: 40,
    fontSize: 48,
    fontFamily: 'Outfit',
    color: '#1f2937',
    fontWeight: 'bold',
    textAlign: 'center',
    width: 80
  });

  return {
    id: crypto.randomUUID(),
    settings,
    pages: [coverPage],
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
