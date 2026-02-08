// ============================================
// Analytics Event Name Constants
// ============================================

export const EVENTS = {
    // Session & Auth
    SESSION_STARTED: 'session_started',
    USER_SIGNED_UP: 'user_signed_up',
    USER_SIGNED_IN: 'user_signed_in',

    // Book Creation
    BOOK_CREATION_STARTED: 'book_creation_started',
    BOOK_CREATED: 'book_created',
    BOOK_CREATION_FAILED: 'book_creation_failed',

    // Book Viewing
    BOOK_VIEWED: 'book_viewed',
    BOOK_PAGE_VIEWED: 'book_page_viewed',
    BOOK_FULLSCREEN_TOGGLED: 'book_fullscreen_toggled',

    // Unlock & Checkout
    UNLOCK_PROMPT_SHOWN: 'unlock_prompt_shown',
    UNLOCK_PROMPT_DISMISSED: 'unlock_prompt_dismissed',
    CHECKOUT_STARTED: 'checkout_started',
    PAYMENT_COMPLETED: 'payment_completed',
    PAYMENT_FAILED: 'payment_failed',
    BOOK_UNLOCKED: 'book_unlocked',
    ORDER_PLACED: 'order_placed',

    // My Books
    MYBOOKS_VIEWED: 'mybooks_viewed',
    BOOK_DELETED: 'book_deleted',

    // Marketing & Navigation
    PAGE_VIEWED: 'page_viewed',
    PRICING_CTA_CLICKED: 'pricing_cta_clicked',
    FAQ_EXPANDED: 'faq_expanded',
    LANGUAGE_CHANGED: 'language_changed',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
