/**
 * PostOffice.Socket — wraps a WebSocket or EventTarget as a named interface.
 * Handles message dispatch, event subscription, keep-alive, and auto-reconnect.
 */

class PostOfficeSocket {

    constructor(_constructor, name, url, options = {}) {
        this.constructedFrom = _constructor || WebSocket;
        this.name            = name;
        this.url             = url;
        this.socket          = new this.constructedFrom(url);
        this.defaultScope    = new EventTarget();
        this.listeners       = [];
        this.autoRetryOnClose   = options.autoRetryOnClose  ?? true;
        this.autoRetryInterval  = options.autoRetryInterval ?? 5;
        this.INTERFACE_SPEC  = null;
        this.on = this.addListener.bind(this);
        this.__init__();
    }

    __init__() {
        if (this.socket instanceof WebSocket) {
            this._keepAlive();
        }

        this.socket.addEventListener("message", ev => this._handleSocketMsgEv(ev));
        this.socket.addEventListener("close",   ev => this._handleSocketCloseEv(ev));
        this.socket.addEventListener("open",    ev => this._handleSocketOpenEv(ev));
        this.socket.addEventListener("error",   ev => this._handleSocketErrorEv(ev));
    }

    _keepAlive() {
        clearInterval(this._keepAliveTimer);
        this._keepAliveTimer = setInterval(() => {
            if (this.keepAlive) this.send("ping");
        }, 59000);
    }

    // Override per-socket to customize message parsing
    onmessage(socketMsgEv) {
        const str = socketMsgEv.data;
        if (str === "pong") return null;
        try {
            const msg = JSON.parse(str);
            return new CustomEvent(msg.label, { detail: msg });
        } catch(e) {
            const errMsg = { error: e, label: `${this.name}-message-error` };
            return new CustomEvent(errMsg.label, { detail: errMsg });
        }
    }

    _handleSocketMsgEv(socketMsgEv) {
        const ev = this.onmessage(socketMsgEv);
        if (ev) this.dispatchEvent(ev);
    }

    _handleSocketOpenEv(ev) {
        this.dispatchMessage(ev.type, ev);
    }

    _handleSocketCloseEv(ev) {
        this.dispatchMessage(ev.type, ev);
        if (this.autoRetryOnClose) {
            setTimeout(() => {
                this.socket = new this.constructedFrom(this.url);
                this.__init__();
            }, this.autoRetryInterval * 1000);
        }
    }

    _handleSocketErrorEv(ev) {
        this.dispatchMessage(ev.type, ev);
        console.error(`PostOffice.Socket [${this.name}] errored`);
    }

    send(msg) {
        this.socket.send(msg);
    }

    addInterfaceSpec(spec) {
        this.INTERFACE_SPEC = spec;
        this._initLexiconSubscriptions();
    }

    _initLexiconSubscriptions() {
        if (!this.INTERFACE_SPEC) return;
        for (const key in this.INTERFACE_SPEC) {
            const entry = this.INTERFACE_SPEC[key];
            if (entry?.schema?.subscribe) {
                this.publish(key, {});
            }
        }
    }

    publish(label, msg) {
        if (!this.INTERFACE_SPEC) throw new Error(`PostOffice.Socket [${this.name}]: no interface spec — cannot publish`);
        const lexeme = this.INTERFACE_SPEC[label];
        if (!lexeme) throw new Error(`PostOffice.Socket [${this.name}]: unknown lexeme "${label}"`);
        const inflection = lexeme.inflect(msg);
        if (!inflection) throw new Error(`PostOffice.Socket [${this.name}]: inflection failed for "${label}"`);
        const ev = new CustomEvent(label, { detail: inflection.get() });
        this.defaultScope.dispatchEvent(ev);
    }

    dispatchMessage(label, msg) {
        const ev = new CustomEvent(label, { detail: msg });
        this.dispatchEvent(ev);
    }

    dispatchEvent(ev) {
        this.defaultScope.dispatchEvent(ev);
    }

    addListener(label, cb) {
        return new Promise((resolve, reject) => {
            const wrapped = ev => {
                try { resolve(cb(ev.detail)); } catch(e) { reject(e); }
            };
            this.defaultScope.addEventListener(label, wrapped);
            this.listeners.push({ label, cb });
        });
    }

    broadcastMsg(label, msg) {
        if (!label) return;
        this.dispatchEvent(new CustomEvent(label, { detail: msg }));
    }
}

export { PostOfficeSocket };
