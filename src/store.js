import { PostOffice } from "./post_office.js";
import "localforage";

/**
 * Creates a named reactive store. Multiple components can subscribe by reference.
 *
 * Options:
 *   persist  {boolean}  — persist state to IndexedDB via localforage (default: false)
 *   socket   {string}   — PostOffice interface name to sync incoming messages into state
 *   socketLabel {string} — message label to listen for on the socket
 */
function createStore(name, initialState = {}, options = {}) {
    const opts = { persist: false, socket: null, socketLabel: null, ...options };
    const subscribers = new Set();
    let state = { ...initialState };

    const store = {
        name,

        get() {
            return state;
        },

        set(partial) {
            state = { ...state, ...partial };
            if (opts.persist) {
                localforage.setItem(name, state).catch(e =>
                    console.warn(`Muffin.Store: persist failed for "${name}" -`, e)
                );
            }
            subscribers.forEach(cb => { try { cb(state); } catch(e) { console.error(`Muffin.Store: subscriber error in "${name}" -`, e); } });
        },

        reset() {
            state = { ...initialState };
            if (opts.persist) localforage.removeItem(name).catch(() => {});
            subscribers.forEach(cb => { try { cb(state); } catch(e) {} });
        },

        subscribe(cb) {
            subscribers.add(cb);
            return () => subscribers.delete(cb);
        }
    };

    // Rehydrate from IndexedDB on init
    if (opts.persist) {
        localforage.getItem(name).then(persisted => {
            if (persisted && typeof persisted === 'object') {
                state = { ...state, ...persisted };
                subscribers.forEach(cb => { try { cb(state); } catch(e) {} });
            }
        }).catch(() => {});
    }

    // Sync from PostOffice socket
    if (opts.socket && opts.socketLabel) {
        const socket = PostOffice.getOrCreateInterface(opts.socket);
        socket.addListener(opts.socketLabel, msg => {
            const payload = msg?.data || msg?.result || msg;
            if (payload && typeof payload === 'object') store.set(payload);
        });
    }

    return Object.freeze(store);
}

export { createStore };
