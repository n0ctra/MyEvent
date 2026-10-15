/* ============================================================
   MyEvent Tech — Cliente Supabase compartido.
   Lee las claves de `./supabase-config.js` (gitignoreado).
   ============================================================ */

   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
   import { SUPABASE_CONFIG } from './supabase-config.js';
   
   if (!SUPABASE_CONFIG?.url || !SUPABASE_CONFIG?.anonKey) {
     console.error(
       '[supabase] Falta configuración.\n' +
       'Copia supabase-config.example.js → supabase-config.js y rellena tus valores.'
     );
   }
   
   export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
     auth: {
       persistSession: true,
       autoRefreshToken: true,
       detectSessionInUrl: true
     }
   });