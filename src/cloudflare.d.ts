// Khai báo tối thiểu cho module runtime của Cloudflare, đủ để đọc binding Workers AI (env.AI).
// Giá trị được kiểm bằng isWorkersAi trước khi dùng. Nếu sau này sinh worker-configuration.d.ts
// bằng `npm run generate-types` thì xóa file này để tránh khai báo trùng.
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
