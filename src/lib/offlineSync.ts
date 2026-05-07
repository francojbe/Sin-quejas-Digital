import { supabase } from './supabase';

export interface OfflineAction {
  id?: number;
  type: 'play_card_mirror' | 'play_card_block' | 'play_card_normal' | 'handle_action';
  payload: any;
  timestamp: number;
}

const DB_NAME = 'SinQuejasOfflineDB';
const STORE_NAME = 'pendingActions';
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export async function savePendingAction(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add({ ...action, timestamp: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by timestamp to ensure chronological replay
      const actions = request.result.sort((a: OfflineAction, b: OfflineAction) => a.timestamp - b.timestamp);
      resolve(actions);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingAction(id: number) {
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function processPendingActions() {
  const actions = await getPendingActions();
  if (actions.length === 0) return;

  console.log(`[OfflineSync] Procesando ${actions.length} acciones pendientes...`);
  
  // Calcular offset para no tener desface de reloj con el partner
  let serverTimeOffset = 0;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, { 
      method: 'HEAD', 
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } 
    });
    const dateHeader = res.headers.get('Date');
    if (dateHeader) {
      serverTimeOffset = new Date(dateHeader).getTime() - Date.now();
    }
  } catch (err) {
    console.warn("No se pudo obtener el tiempo del servidor en sync:", err);
  }

  for (const action of actions) {
    try {
      if (action.type === 'play_card_mirror') {
        const { playerCardId, displayedCardId, userId } = action.payload;
        const freshServerNow = new Date(Date.now() + serverTimeOffset).toISOString();
        await supabase.from("player_cards").update({ status: 'discarded', played_at: freshServerNow }).eq("id", playerCardId);
        await supabase.from("player_cards").update({ user_id: userId, played_at: freshServerNow }).eq("id", displayedCardId);
      } 
      else if (action.type === 'play_card_block') {
        const { playerCardId, displayedCardId } = action.payload;
        const freshServerNow = new Date(Date.now() + serverTimeOffset).toISOString();
        await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCardId);
        await supabase.from("player_cards").update({ status: 'discarded', played_at: freshServerNow }).eq("id", playerCardId);
      }
      else if (action.type === 'play_card_normal') {
        const { playerCardId, updates, gameUpdates, gameId } = action.payload;
        updates.played_at = new Date(Date.now() + serverTimeOffset).toISOString(); // Reset timer for the partner synchronously
        await supabase.from("player_cards").update(updates).eq("id", playerCardId);
        if (Object.keys(gameUpdates).length > 0) {
          await supabase.from("games").update(gameUpdates).eq("id", gameId);
        }
      }
      else if (action.type === 'handle_action') {
        const { displayedCardId, status, gameId, userId, cardId, cardTitle, partnerId, profileDisplayName } = action.payload;
        await supabase.from("player_cards").update({ status }).eq("id", displayedCardId);
        
        await supabase.from('game_history').insert({
          game_id: gameId,
          user_id: userId,
          action_type: status === 'active' ? 'ACCEPTED' : 'BLOCKED',
          card_id: cardId,
          metadata: { 
            card_title: cardTitle,
            message: status === 'active' ? 'ha aceptado el desafío' : 'ha bloqueado el desafío'
          }
        });

        if (partnerId) {
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-partner`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              user_id: partnerId,
              title: status === 'active' ? "¡Desafío Aceptado! 🔥" : "Desafío Bloqueado 🛡️",
              body: `${profileDisplayName || 'Tu pareja'} ${status === 'active' ? 'ha aceptado' : 'ha bloqueado'} tu carta: ${cardTitle}`
            })
          }).catch(err => console.error("Error notifying partner from offline sync:", err));
        }
      }
      
      // Si la acción fue exitosa, la borramos de IndexedDB
      if (action.id) {
        await removePendingAction(action.id);
      }
    } catch (error) {
      console.error(`[OfflineSync] Error procesando acción ${action.id}:`, error);
      // Rompemos el ciclo para mantener el orden cronológico. Se reintentará luego.
      break;
    }
  }
}
