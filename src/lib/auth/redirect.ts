/**
 * Đường dẫn chuyển tới sau khi đăng nhập. Chỉ nhận đường dẫn nội bộ bắt đầu bằng một dấu `/`,
 * không nhận URL đầy đủ hay `//host` (skill security).
 */
export function safeNext(value: unknown, fallback = '/hom-nay'): string {
  if (typeof value !== 'string' || value.length > 200) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
