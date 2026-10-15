/* ============================================================
   MyEvent Tech — Store de eventos (Supabase).
   API:
     getAll()          → Promise<Event[]>
     getById(slug)     → Promise<Event | null>
     create(event)     → Promise<Event>
     update(slug, patch) → Promise<Event | null>
     remove(slug)      → Promise<boolean>
     _raw()            → Event[] (última carga cacheada)

   Mapea snake_case de Supabase ↔ camelCase del frontend,
   para que los app.js no cambien su forma de leer los datos.
   ============================================================ */

   import { supabase } from './supabase-client.js';

   let cache = [];
   
   // ---------- Utilidades ----------
   function slugify(s) {
     return String(s || '')
       .toLowerCase()
       .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/^-|-$/g, '');
   }
   
   /** Fila de Supabase → objeto del frontend (camelCase). */
   function rowToEvent(row) {
     if (!row) return null;
     return {
       id:              row.slug,          // la app usa el slug como id
       dbId:            row.id,            // UUID real, por si se necesita
       title:           row.title,
       category:        row.category,
       date:            row.date,
       durationMinutes: row.duration_minutes,
       location:        row.location,
       address:         row.address,
       mapLabel:        row.map_label,
       heroImage:       row.hero_image,
       gallery:         row.gallery || [],
       highlights:      row.highlights || [],
       agenda:          row.agenda || [],
       faqs:            row.faqs || [],
       unitPrice:       row.unit_price,
       currency:        row.currency,
       spotsTotal:      row.spots_total,
       spotsLeft:       row.spots_left,
       maxPerOrder:     row.max_per_order,
       organizer:       row.organizer_name
                          ? { name: row.organizer_name, verified: true }
                          : { name: 'MyEvent Tech', verified: true },
       description:     row.description || [],
       transport:       row.transport,
       parking:         row.parking,
       waitlist:        row.waitlist,
       status:          row.status,
       tags:            row.tags || []
     };
   }
   
   /** Objeto del frontend → fila de Supabase (snake_case). */
   function eventToRow(event, organizerId) {
     return {
       slug:             event.slug,
       organizer_id:     organizerId,
       title:            event.title,
       category:         event.category,
       description:      event.description || [],
       status:           'published',
       date:             event.date,
       duration_minutes: event.durationMinutes || null,
       location:         event.location,
       address:          event.address || null,
       map_label:        event.mapLabel || null,
       transport:        event.transport || null,
       parking:          event.parking || null,
       hero_image:       event.heroImage || null,
       gallery:          event.gallery || [],
       highlights:       event.highlights || [],
       agenda:           event.agenda || [],
       faqs:             event.faqs || [],
       unit_price:       event.unitPrice || 0,
       currency:         event.currency || 'COP',
       spots_total:      event.spotsTotal,
       spots_left:       event.spotsLeft ?? event.spotsTotal,
       max_per_order:    event.maxPerOrder || 10,
       waitlist:         event.waitlist ?? true,
       tags:             event.tags || []
     };
   }
   
   /** Genera un slug único probando sufijos numéricos. */
   async function generateUniqueSlug(base) {
     let slug = base || 'evento';
     let i = 2;
     // eslint-disable-next-line no-constant-condition
     while (true) {
       const { data } = await supabase
         .from('events')
         .select('id')
         .eq('slug', slug)
         .maybeSingle();
       if (!data) return slug;
       slug = base + '-' + (i++);
     }
   }
   
   // ---------- API ----------
   export const eventsStore = {
     async getAll() {
       const { data, error } = await supabase
         .from('events_public')
         .select('*')
         .order('date', { ascending: true });
   
       if (error) {
         console.error('[events] getAll:', error);
         return [];
       }
       cache = (data || []).map(rowToEvent);
       return cache;
     },
   
     async getById(slug) {
       if (!slug) return null;
       const { data, error } = await supabase
         .from('events_public')
         .select('*')
         .eq('slug', slug)
         .maybeSingle();
   
       if (error) {
         console.error('[events] getById:', error);
         return null;
       }
       return rowToEvent(data);
     },
   
     async create(event) {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('Debes iniciar sesión para crear un evento.');
   
       const baseSlug = event.slug || slugify(event.title) || 'evento';
       const slug = await generateUniqueSlug(baseSlug);
   
       const row = eventToRow({ ...event, slug }, user.id);
   
       const { data, error } = await supabase
         .from('events')
         .insert(row)
         .select()
         .single();
   
       if (error) {
         console.error('[events] create:', error);
         throw new Error(error.message);
       }
   
       // Re-consultar la vista para traer organizer_name
       const created = await this.getById(slug);
       return created || rowToEvent(data);
     },
   
     async update(slug, patch) {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('No autenticado');
   
       const { data: existing } = await supabase
         .from('events')
         .select('id, organizer_id')
         .eq('slug', slug)
         .maybeSingle();
   
       if (!existing || existing.organizer_id !== user.id) return null;
   
       const row = eventToRow({ ...patch, slug }, user.id);
       delete row.slug;
       delete row.organizer_id;
   
       const { error } = await supabase
         .from('events')
         .update(row)
         .eq('id', existing.id);
   
       if (error) {
         console.error('[events] update:', error);
         return null;
       }
       return this.getById(slug);
     },
   
     async remove(slug) {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return false;
   
       const { data: existing } = await supabase
         .from('events')
         .select('id, organizer_id')
         .eq('slug', slug)
         .maybeSingle();
   
       if (!existing || existing.organizer_id !== user.id) return false;
   
       const { error } = await supabase
         .from('events')
         .delete()
         .eq('id', existing.id);
   
       return !error;
     },
   
     _raw() { return cache.slice(); }
   };
   
   // ---------- Helper: id desde la URL ----------
   export function getEventIdFromUrl() {
     const search = window.location.search || '';
     const hash   = window.location.hash   || '';
   
     const sp = new URLSearchParams(search.replace(/^\?/, ''));
     let id = sp.get('id') || sp.get('event');
     if (id) return id;
   
     const hp = new URLSearchParams(hash.replace(/^#\??/, '').replace(/^\//, ''));
     id = hp.get('id') || hp.get('event');
     if (id) return id;
   
     const m = hash.match(/^#\/?([a-z0-9-]+)/i);
     return m ? m[1] : null;
   }