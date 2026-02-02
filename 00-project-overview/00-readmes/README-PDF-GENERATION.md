# PDF Generation

> Export books as downloadable PDFs

## Overview

The PDF generation service creates downloadable PDF files from book data using jsPDF. PDFs can be downloaded directly by users or generated for print orders.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  StoryBook      │────▶│  PDF Generator   │────▶│  PDF Blob       │
│  Viewer         │     │  lib/pdf-        │     │  Download       │
└─────────────────┘     │  generator.ts    │     └─────────────────┘
                        └──────────────────┘
```

---

## Usage

### Generate and Download

```typescript
import { generateBookPDF, downloadPDF } from '@/lib/pdf-generator';

const blob = await generateBookPDF(book);
downloadPDF(blob, 'my-story-book.pdf');
```

### In StoryBookViewer

```typescript
const handleDownload = async () => {
  setIsDownloading(true);
  try {
    const blob = await generateBookPDF(book);
    const filename = `${book.settings.title}.pdf`
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    downloadPDF(blob, filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    setIsDownloading(false);
  }
};
```

---

## PDF Structure

### Page Layout

| Dimension | Value |
|-----------|-------|
| Format | A4 Portrait |
| Width | 210mm |
| Height | 297mm |
| Margins | 15mm |
| Content Width | 180mm |
| Content Height | 267mm |

### Cover Page

- Full-page background image or gradient
- Semi-transparent overlay at bottom
- Title (32pt, bold, white)
- Subtitle with child name and age (16pt)

### Content Pages

- Image area: Top 55% of content height
- Text area: Below image with 10mm gap
- Page number: Centered at bottom

---

## API Reference

### generateBookPDF(book: Book): Promise<Blob>

Generates a complete PDF from a Book object.

**Parameters:**
- `book` - Book object with settings and pages

**Returns:**
- PDF as Blob

**Process:**
1. Create jsPDF instance (A4 portrait)
2. Add cover page with image/gradient
3. Loop through content pages
4. Add images and text for each page
5. Return as Blob

### downloadPDF(blob: Blob, filename: string): void

Triggers browser download of PDF.

**Parameters:**
- `blob` - PDF Blob
- `filename` - Download filename

---

## Internal Functions

### loadImageAsBase64(url: string): Promise<string | null>

Converts image URL to base64 for embedding in PDF.

```typescript
// Handles both URLs and existing base64
if (url.startsWith('data:')) {
  return url;
}
const response = await fetch(url);
const blob = await response.blob();
// Convert to base64...
```

### getPageText(page: BookPage): string

Extracts text content from page's text elements.

```typescript
return page.textElements.map(el => el.content).join('\n\n');
```

### getPageImage(page: BookPage): string | null

Gets the background image URL from a page.

```typescript
return page.backgroundImage || 
       page.background_image || 
       null;
```

### addCoverPage(pdf: jsPDF, book: Book): Promise<void>

Renders the cover page:
- Full-bleed image or gradient background
- Semi-transparent overlay
- Title and subtitle text

### addContentPages(pdf: jsPDF, book: Book): Promise<void>

Renders all content pages:
- Image in top portion
- Text below image
- Page numbers

---

## Styling

### Fonts

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Cover Title | Helvetica | 32pt | Bold |
| Cover Subtitle | Helvetica | 16pt | Normal |
| Story Text | Helvetica | 14pt | Normal |
| Page Number | Helvetica | 10pt | Normal |

### Colors

| Element | Color |
|---------|-------|
| Cover Text | White (#FFFFFF) |
| Story Text | Dark Gray (#2D2D2D) |
| Page Numbers | Light Gray (#969696) |
| Placeholder BG | Light Gray (#F0F0F0) |
| Fallback Cover | Indigo (#6366F1) |

---

## Error Handling

### Missing Images

If an image fails to load:
- Cover: Falls back to solid indigo background
- Content: Shows gray placeholder with 📖 emoji

### Large Files

For books with many high-resolution images:
- Images are embedded as JPEG
- Consider implementing image compression

---

## Print-Ready PDFs

For Lulu print orders, additional considerations:

| Requirement | Implementation |
|-------------|----------------|
| Bleed | Add 3mm bleed area |
| Color Space | Convert to CMYK |
| Resolution | Minimum 300 DPI |
| Spine | Calculate based on page count |

---

## Dependencies

```json
{
  "jspdf": "^2.5.1"
}
```

---

## Files

| File | Purpose |
|------|---------|
| `lib/pdf-generator.ts` | PDF generation logic |
| `components/StoryBookViewer.tsx` | Download button integration |
