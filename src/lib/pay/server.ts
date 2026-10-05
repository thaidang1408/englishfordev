import { orderRepo } from '../db/orders';
import { createServiceDb } from '../db/service';
import type { Db } from '../db/supabase';
import { payosConfig, serverEnv } from '../env-server';
import type { OrderRepo } from './handlers';
import { payosClient, type PayosClient } from './payos';

/** Dựng repo đơn hàng và client payOS cho một request. Chỉ import từ route ở server. */
export function payDeps(db: Db): { repo: OrderRepo | null; payos: PayosClient | null; checksumKey: string | null; adminEmails: string[] } {
  const env = serverEnv();
  const cfg = payosConfig(env);
  return {
    repo: env.SUPABASE_SERVICE_ROLE_KEY ? orderRepo(db, createServiceDb(env.SUPABASE_SERVICE_ROLE_KEY)) : null,
    payos: cfg ? payosClient(cfg) : null,
    checksumKey: cfg?.checksumKey ?? null,
    adminEmails: env.ADMIN_EMAILS,
  };
}

