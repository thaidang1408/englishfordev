// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Không dùng Astro sessions (đăng nhập dùng cookie Supabase), nên không cần KV.
  session: false,
  // Ảnh tự tối ưu trước khi đưa vào public/, không cần binding Cloudflare Images.
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
