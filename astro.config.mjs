// @ts-check
import { defineConfig } from 'astro/config';

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

  vite: {
    plugins: [tailwindcss()]
  }
});
