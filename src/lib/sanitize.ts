import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window as unknown as typeof globalThis);

purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.hasAttribute('src')) {
    const src = node.getAttribute('src') || '';
    if (!src.startsWith('https://')) {
      node.removeAttribute('src');
    }
  }
});

export function sanitizeHtml(dirty: string): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['a', 'b', 'br', 'em', 'i', 'img', 'li', 'ol', 'p', 'strong', 'ul'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
  });
}

// Strip all HTML tags and return plain text. Used for description excerpts
// where the source provides HTML (e.g. Atom <summary type="html"> fields).
export function stripHtml(dirty: string): string {
  return purify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
