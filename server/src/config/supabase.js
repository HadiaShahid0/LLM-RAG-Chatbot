import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export const BUCKET_NAME =
  process.env.SUPABASE_BUCKET || "chat-documents";

export default supabase;