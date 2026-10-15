/* ============================================================
   MyEvent Tech — Store de reservas (Supabase).
   API:
     getByUser()           → Promise<Reservation[]>
     getById(id)           → Promise<Reservation | null>
     create(data)          → Promise<Reservation>
     cancel(id)            → Promise<Reservation | null>
     on(fn)                → unsubscribe

   Los triggers SQL de la tabla se encargan de:
     - Decrementar spots_left al insertar (status='confirmed')
     - Restaurar spots_left al cancelar (status='cancelled')
   ============================================================ */

   import { supabase } from './supabase-client.js';

   const listeners = new Set();
   
   function emit() {
     listeners.forEach((fn) => {
       try { fn(); } catch (e) { console.error(e); }
     });
   }
   
   /** Fila de Supabase → objeto del frontend (camelCase). */
   function rowToReservation(row) {
     if (!row) return null;
     return {
       id:             row.id,
       code:           row.code,
       userId:         row.user_id,
       eventId:        row.events?.slug || null,   // slug del evento (para enlaces)
       eventDbId:      row.event_id,               // UUID del evento en Supabase
       eventTitle:     row.event_title_snapshot,
       eventDate:      row.event_date_snapshot,
       eventLocation:  row.event_location_snapshot,
       eventImage:     row.event_image_snapshot,
       eventCategory:  row.event_category_snapshot,
       tickets:        row.tickets,
       unitPrice:      row.unit_price,
       total:          row.total,
       currency:       row.currency,
       status:         row.status,                 // confirmed | cancelled | attended
       attendee: {
         name:  row.attendee_name,
         email: row.attendee_email,
         phone: row.attendee_phone,
         notes: row.attendee_notes
       },
       createdAt:      row.created_at,
       cancelledAt:    row.cancelled_at
     };
   }
   
   export const reservationsStore = {
     async getByUser() {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return [];
   
       const { data, error } = await supabase
         .from('reservations')
         .select('*, events(slug)')
         .eq('user_id', user.id)
         .order('event_date_snapshot', { ascending: false });
   
       if (error) {
         console.error('[reservations] getByUser:', error);
         return [];
       }
       return (data || []).map(rowToReservation);
     },
   
     async getById(id) {
       if (!id) return null;
       const { data, error } = await supabase
         .from('reservations')
         .select('*, events(slug)')
         .eq('id', id)
         .maybeSingle();
   
       if (error) {
         console.error('[reservations] getById:', error);
         return null;
       }
       return rowToReservation(data);
     },
   
     /**
      * Crea una reserva. El código se genera en el servidor (DEFAULT del SQL).
      * @param {{
      *   eventDbId: uuid,          // UUID del evento en Supabase
      *   tickets: number,
      *   unitPrice: number,
      *   total: number,
      *   currency?: string,
      *   eventTitle: string,
      *   eventDate: string,        // ISO
      *   eventLocation?: string,
      *   eventImage?: string,
      *   eventCategory?: string,
      *   attendee: { name, email, phone?, notes? }
      * }} data
      */
     async create(data) {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('Debes iniciar sesión para reservar.');
   
       if (!data.eventDbId) throw new Error('Evento inválido (falta UUID).');
   
       const row = {
         user_id:                 user.id,
         event_id:                data.eventDbId,
         tickets:                 data.tickets,
         unit_price:              data.unitPrice,
         total:                   data.total,
         currency:                data.currency || 'COP',
         status:                  'confirmed',
         attendee_name:           data.attendee?.name || '',
         attendee_email:          data.attendee?.email || '',
         attendee_phone:          data.attendee?.phone || null,
         attendee_notes:          data.attendee?.notes || null,
         event_title_snapshot:    data.eventTitle,
         event_date_snapshot:     data.eventDate,
         event_location_snapshot: data.eventLocation || null,
         event_image_snapshot:    data.eventImage || null,
         event_category_snapshot: data.eventCategory || null
       };
   
       const { data: inserted, error } = await supabase
         .from('reservations')
         .insert(row)
         .select('*, events(slug)')
         .single();
   
       if (error) {
         console.error('[reservations] create:', error);
         if (/No hay suficientes plazas/i.test(error.message)) {
           throw new Error('No quedan suficientes plazas para esa cantidad.');
         }
         if (/duplicate key/i.test(error.message) && /code/i.test(error.message)) {
           throw new Error('Error generando el código. Intenta de nuevo.');
         }
         throw new Error(error.message || 'No se pudo crear la reserva.');
       }
   
       emit();
       return rowToReservation(inserted);
     },
   
     async cancel(id) {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return null;
   
       const { data, error } = await supabase
         .from('reservations')
         .update({ status: 'cancelled' })
         .eq('id', id)
         .eq('user_id', user.id)
         .select('*, events(slug)')
         .maybeSingle();
   
       if (error) {
         console.error('[reservations] cancel:', error);
         return null;
       }
       emit();
       return rowToReservation(data);
     },
   
     on(fn) {
       listeners.add(fn);
       return () => listeners.delete(fn);
     }
   };