export type PendingMessage={id:string,conversationId:string,body:string,createdAt:number,status:"queued"|"sending"|"failed"};
export function createMessageId(){return `${Date.now()}-${Math.random().toString(36).slice(2)}`}
// MVP boundary: replace with IndexedDB implementation (Dexie or native IDB).
// Required behavior: persist pending messages, retry after reconnect, dedupe by id. 
export const offlineQueue={async enqueue(_:PendingMessage){},async flush(){}};