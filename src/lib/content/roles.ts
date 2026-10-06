import { z } from 'zod';
import { ROLES, roleSchema, type Role } from './schema';

export { ROLES, roleSchema, type Role };

export const ROLE_NAMES: Record<Role, string> = { dev: 'Dev', qa: 'QA, tester', ba: 'BA', pm: 'PM' };
export const ROLE_SHORT: Record<Role, string> = { dev: 'Dev', qa: 'QA', ba: 'BA', pm: 'PM' };

/** Một dòng giải thích cho người mới chưa quen các tên viết tắt. */
export const ROLE_HINTS: Record<Role, string> = {
  dev: 'Lập trình viên: viết code, sửa bug, review code của đồng đội.',
  qa: 'Kiểm thử: viết test case, tìm bug và báo bug cho dev.',
  ba: 'Phân tích nghiệp vụ: làm rõ yêu cầu với khách, viết user story.',
  pm: 'Quản lý dự án: lên kế hoạch, báo tiến độ và rủi ro cho khách.',
};

/** Đọc các ô chọn `roles` trong form. Không chọn ô nào hoặc giá trị lạ thì trả null. */
export function parseRoles(form: FormData): Role[] | null {
  const parsed = z.array(roleSchema).min(1).max(ROLES.length).safeParse(form.getAll('roles'));
  return parsed.success ? ROLES.filter((r) => parsed.data.includes(r)) : null;
}

/** Bài dành cho người dùng này: bài không gắn ngành là bài chung; người chưa chọn ngành thì bài nào cũng hợp. */
export function fitsRoles(lessonRoles: readonly Role[] | undefined, mine: readonly Role[]): boolean {
  return !lessonRoles || mine.length === 0 || lessonRoles.some((r) => mine.includes(r));
}
