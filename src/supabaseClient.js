import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xrsgsounacjicauxvmlg.supabase.co";
const supabaseKey = "sb_publishable_HEUCQTcyD4ajKPq3J-Q1Sw_mTCj-eYn";

export const supabase = createClient(supabaseUrl, supabaseKey);
