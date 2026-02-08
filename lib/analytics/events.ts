// ============================================
// Analytics Event Property Types
// ============================================

// Session & Auth
export interface SessionStartedProps {
    referrer: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    landing_page: string;
}

export interface UserAuthProps {
    method: 'email' | 'google';
    referrer_page: string;
}

// Book Creation
export interface BookCreationStartedProps {
    // Hero details (Step 1)
    child_name: string;
    child_age: number;
    child_gender: 'boy' | 'girl' | 'other' | null;
    has_photo: boolean;

    // Theme details (Step 2)
    book_theme: string;
    story_prompt: string;
    story_prompt_length: number;

    // Format details (Step 3)
    book_format: 'square' | 'portrait';

    // Style
    art_style: string;

    // Meta
    language: string;
    entry_point: 'homepage' | 'navbar' | 'mybooks' | 'unknown';
}

export interface BookCreatedProps extends BookCreationStartedProps {
    // Outputs
    book_id: string;
    book_title: string;
    page_count: number;
    is_preview: boolean;
    preview_page_count: number;

    // Generation metadata
    generation_time_ms: number;
    character_extraction_time_ms: number;
    generation_request_id: string;
}

export interface BookCreationFailedProps extends BookCreationStartedProps {
    error_phase: 'extraction' | 'story' | 'illustration' | 'save';
    error_message: string;
    error_code?: string;
    generation_time_ms: number;
}

// Book Viewing
export interface BookViewedProps {
    book_id: string;
    book_title: string;
    is_owner: boolean;
    is_preview: boolean;
    view_source: 'creation' | 'mybooks' | 'direct_link';
}

export interface BookPageViewedProps {
    book_id: string;
    page_number: number;
    page_type: 'cover' | 'inside' | 'back';
}

export interface BookFullscreenToggledProps {
    book_id: string;
    is_entering: boolean;
}

// Unlock & Checkout
export interface UnlockPromptShownProps {
    book_id: string;
    trigger: 'locked_page' | 'button';
}

export interface CheckoutStartedProps {
    book_id: string;
    checkout_type: 'digital' | 'print';
    price_usd: number;
}

export interface PaymentCompletedProps {
    book_id: string;
    payment_type: 'digital_unlock' | 'print_order';
    amount_usd: number;
    payment_method: string;
    stripe_payment_intent_id: string;
}

export interface PaymentFailedProps {
    book_id: string;
    payment_type: 'digital_unlock' | 'print_order';
    error_code?: string;
    error_message: string;
}

export interface BookUnlockedProps {
    book_id: string;
    pages_generated: number;
}

export interface OrderPlacedProps {
    book_id: string;
    order_id: string;
    format: string;
    size: string;
    quantity: number;
    total_usd: number;
    shipping_country: string;
}

// My Books
export interface MyBooksViewedProps {
    book_count: number;
}

export interface BookDeletedProps {
    book_id: string;
    was_preview: boolean;
}

// Marketing & Navigation
export interface PageViewedProps {
    page_name: string;
}

export interface PricingCtaClickedProps {
    cta_location: string;
}

export interface FaqExpandedProps {
    question_id: string;
}

export interface LanguageChangedProps {
    from_language: string;
    to_language: string;
}

// User properties for profile
export interface UserProperties {
    $email?: string;
    $name?: string;
    total_books_created?: number;
    total_books_purchased?: number;
    total_spent_usd?: number;
    last_book_theme?: string;
    preferred_language?: string;
}
