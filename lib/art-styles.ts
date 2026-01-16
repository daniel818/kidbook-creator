// ============================================
// Art Styles for Book Illustrations
// ============================================
// Available styles inspired by Google's Storybook feature

export type ImageQuality = 'fast' | 'pro';

export const ART_STYLES = {
    storybook_classic: {
        label: 'Classic Storybook',
        description: 'Traditional children\'s book style',
        prompt: 'classic children\'s book illustration style, warm and inviting, professional quality, soft colors, hand-drawn feel'
    },
    watercolor: {
        label: 'Watercolor',
        description: 'Soft, dreamy paintings',
        prompt: 'soft watercolor painting style, gentle pastel colors, painterly brushstrokes, dreamy and ethereal'
    },
    digital_art: {
        label: 'Digital Art',
        description: 'Clean, modern look',
        prompt: 'clean digital art illustration, vibrant colors, modern style, crisp lines, polished finish'
    },
    cartoon: {
        label: 'Cartoon',
        description: 'Fun, animated style',
        prompt: 'fun cartoon style, bold outlines, bright cheerful colors, animated look, expressive characters'
    },
    pixel_art: {
        label: 'Pixel Art',
        description: 'Retro gaming aesthetic',
        prompt: 'charming pixel art style, retro gaming aesthetic, 16-bit colors, nostalgic feel'
    },
    coloring_book: {
        label: 'Coloring Book',
        description: 'Black and white outlines',
        prompt: 'black and white line art, clear outlines only, no shading, suitable for coloring, clean lines'
    }
} as const;

export type ArtStyle = keyof typeof ART_STYLES;
