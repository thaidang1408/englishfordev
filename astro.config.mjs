// @ts-check
import { defineConfig, envField } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // URL gốc cho canonical và thẻ OG. Đặt PUBLIC_SITE_URL khi build nếu đổi tên miền.
  site: process.env.PUBLIC_SITE_URL || 'https://epc-app.englishfordev.workers.dev',
  // Không dùng Astro sessions (đăng nhập dùng cookie Supabase), nên không cần KV.
  session: false,
  // Ảnh tự tối ưu trước khi đưa vào public/, không cần binding Cloudflare Images.
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [react()],
  // CSS nhỏ, nhúng thẳng vào HTML để không chặn lần vẽ đầu.
  build: { inlineStylesheets: 'always' },
  // Biến PUBLIC_ được nhúng lúc build. Để optional cho build và test chạy được khi chưa có key;
  // src/lib/env.ts kiểm lại lúc chạy và báo đúng tên biến còn thiếu.
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public', optional: true }),
      // Chỉ đọc ở server, không vào bundle trình duyệt. Trên Cloudflare đặt bằng `wrangler secret put`.
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      ANTHROPIC_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      AI_MODEL: envField.string({ context: 'server', access: 'secret', optional: true }),
      AI_DAILY_CALL_CAP: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
