declare namespace App {
  interface Locals {
    supabase: import('./lib/db/supabase').Db;
    user: { id: string; email: string | null } | null;
  }
}
