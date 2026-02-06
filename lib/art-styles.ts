// ============================================
// Art Styles for Book Illustrations
// ============================================
// Available styles inspired by Google's Storybook feature

export type ImageQuality = 'fast' | 'pro';

export const ART_STYLES = {
    storybook_classic: {
        label: 'Classic Storybook',
        description: 'Traditional children\'s book style',
        prompt: 'Classic children\'s book illustration in the golden-age picture book tradition. ' +
            'Medium-weight ink outlines with soft interior shading. Warm, muted palette ' +
            'dominated by honey yellows, sage greens, dusty roses, and cream whites. ' +
            'Gentle cross-hatching for texture. Characters rendered with rounded, approachable ' +
            'proportions and expressive dot-and-curve eyes. Backgrounds use layered washes ' +
            'with visible paper texture. Compositions centered and balanced. ' +
            'Hand-drawn feel with slight imperfections that add charm. ' +
            'Soft vignette edges. Cozy, inviting atmosphere throughout.'
    },
    watercolor: {
        label: 'Watercolor',
        description: 'Soft, dreamy paintings',
        prompt: 'Soft watercolor painting with visible wet-on-wet bleeding and granulation effects. ' +
            'Gentle pastel palette: lavender, peach, baby blue, mint green, and warm cream. ' +
            'No hard outlines — forms defined by color transitions and value shifts. ' +
            'Transparent layered washes with white paper showing through for highlights. ' +
            'Characters have soft, rounded features with rosy cheeks and gentle expressions. ' +
            'Backgrounds fade into loose, atmospheric washes. Subtle blooming effects ' +
            'at color boundaries. Dreamy, ethereal quality with luminous light. ' +
            'Compositions feel airy with generous white space.'
    },
    digital_art: {
        label: 'Digital Art',
        description: 'Clean, modern look',
        prompt: 'Clean digital illustration with crisp vector-like edges and flat color areas. ' +
            'Vibrant, saturated palette: bright teals, warm corals, sunny yellows, and rich purples. ' +
            'Smooth gradients for shading, no visible brushstrokes. Characters have ' +
            'geometric-simplified features with large expressive eyes and clean silhouettes. ' +
            'Precise line work with uniform weight. Backgrounds use bold color blocks ' +
            'with subtle texture overlays. Modern, polished finish with strong contrast. ' +
            'Balanced compositions with clear focal hierarchy. ' +
            'Contemporary picture-book aesthetic, print-ready quality.'
    },
    cartoon: {
        label: 'Cartoon',
        description: 'Fun, animated style',
        prompt: 'Energetic cartoon style with bold black outlines of varying thickness for emphasis. ' +
            'Bright, cheerful palette: primary reds, blues, yellows, plus lime green and hot pink. ' +
            'Characters have exaggerated proportions — large heads, big eyes, small bodies, ' +
            'oversized expressions. Flat color fills with simple cel-shading (one shadow tone). ' +
            'Dynamic poses and squash-and-stretch principles. Backgrounds simplified ' +
            'with bold shapes and minimal detail. Speed lines and action effects welcome. ' +
            'Fun, high-energy atmosphere. Comic-book influenced composition ' +
            'with strong silhouettes and clear readability at any size.'
    },
    pixel_art: {
        label: 'Pixel Art',
        description: 'Retro gaming aesthetic',
        prompt: 'Charming pixel art in 16-bit era style with visible pixel grid. ' +
            'Limited palette of 32-48 colors with careful dithering for gradients. ' +
            'Nostalgic gaming aesthetic: warm amber tones, deep teals, bright magentas, ' +
            'and pixel-perfect highlights. Characters built from chunky pixel clusters ' +
            'with recognizable features despite low resolution. ' +
            'Tile-based backgrounds with repeating pattern elements. ' +
            'Clean pixel placement — no anti-aliasing, sharp edges. ' +
            'Retro RPG overworld perspective. Warm CRT-glow feeling. ' +
            'Each element clearly readable with strong color contrast.'
    },
    coloring_book: {
        label: 'Coloring Book',
        description: 'Black and white outlines',
        prompt: 'Black and white line art designed for coloring. Clean, uniform-weight outlines ' +
            'on pure white background. No fills, no shading, no gradients, no gray tones. ' +
            'Characters drawn with clear, closed shapes suitable for coloring within. ' +
            'Medium line thickness (not too thin, not too thick). ' +
            'Simple, well-defined areas — no tiny details that are hard to color. ' +
            'Friendly, rounded character forms with clear expressions. ' +
            'Backgrounds with distinct, colorable regions separated by clear outlines. ' +
            'Every area enclosed for easy filling. Professional coloring-book quality.'
    }
} as const;

export type ArtStyle = keyof typeof ART_STYLES;
