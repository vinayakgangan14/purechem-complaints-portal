import { supabase, getSupabase, isSupabaseConfigured } from "./supabase";

export { supabase, getSupabase, isSupabaseConfigured };

// Fallback stub for legacy imports - operations redirect directly to Supabase
export function getDb() {
  return null;
}
