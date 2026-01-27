import crypto from 'crypto';

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40);
}

function randChunk(length = 4) {
  const bytes = crypto.randomBytes(length);
  return bytes.toString('hex').slice(0, length).toUpperCase();
}

export function generateToken(slug: string) {
  const clean = slug.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  return `TL-${clean}-${randChunk(4)}-${randChunk(4)}`;
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function previewToken(token: string) {
  if (!token) return '';
  const clean = String(token);
  if (clean.length <= 8) return `${clean.slice(0, 2)}***`;
  return `${clean.slice(0, 4)}***${clean.slice(-4)}`;
}
