import { z } from 'zod';
import { changeSchema } from '../ai/schema';

/** Payload của mục ôn own_error do save_correction ghi. Đọc từ database thì kiểm lại bằng schema này. */
export const ownErrorPayloadSchema = changeSchema.extend({
  original: z.string().max(700),
  corrected: z.string().max(1500),
});
export type OwnErrorPayload = z.infer<typeof ownErrorPayloadSchema>;

/** Tách câu gốc thành ba đoạn quanh chỗ sai đầu tiên để tô. Không tìm thấy thì không tô. */
export function splitAround(original: string, fragment: string): [string, string, string] {
  const at = fragment ? original.indexOf(fragment) : -1;
  if (at < 0) return [original, '', ''];
  return [original.slice(0, at), fragment, original.slice(at + fragment.length)];
}
