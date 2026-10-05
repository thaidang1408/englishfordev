import type { APIRoute } from 'astro';
import { publicEnv } from '../../lib/env';
import { sameOrigin } from '../../lib/http/response';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!sameOrigin(request, publicEnv().PUBLIC_SITE_URL)) return redirect('/tai-khoan', 303);
  const { error } = await locals.supabase.auth.signOut();
  if (error) console.error('[auth/signout]', error.message);
  return redirect('/', 303);
};
