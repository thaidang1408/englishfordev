import type { APIRoute } from 'astro';
import { lessons } from '../lib/content/lessons';

/** Sitemap của các trang công khai được index (SPEC mục 3). Bài Premium và trang trong app không có ở đây. */
export const prerender = true;

const STATIC = ['/', '/bang-gia', '/bug-hom-nay', '/dieu-khoan', '/bao-mat'];

export const GET: APIRoute = ({ site }) => {
  const paths = [
    ...STATIC,
    ...lessons.filter((l) => l.free).map((l) => `/hoc/${l.slug}`),
    ...lessons.map((l) => `/mau-cau/${l.slug}`),
  ];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
