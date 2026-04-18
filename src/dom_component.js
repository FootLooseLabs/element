import { randomString } from "./utils.js";
import { DOMComponentRegistry } from "./dom_component_registry.js";
import { PostOffice } from "./post_office.js";
import { DataSource } from "./data_source.js";
import { DefaultConfig } from "./config.js";
import { StateMachineMethods } from "./state_machine.js";
import { EventBinderMethods } from "./event_binder.js";
import { DOMRendererMethods } from "./dom_renderer.js";

class DOMComponent extends HTMLElement {

    static get observedAttributes() { return ['data-update']; }

    static defaultStateSpace = { idle: { apriori: [] } };

    constructor(opt = {}) {
        super();

        if (this._isDebuggable()) DefaultConfig.DEBUG_SCOPE._debugCmp = this;

        this.data        = this.constructor.schema || {};
        this.schema      = this.constructor.schema || {};
        this.domElName   = this.constructor.domElName   || opt.domElName;
        this.interfaces  = this.constructor.interfaces  || opt.interfaces;
        this.stateSpace  = this.constructor.stateSpace  || opt.stateSpace;
        this.LEXICON     = this.constructor.LEXICON     || {};
        this.advertiseAs = this.constructor.advertiseAs;

        this.transitionSpace   = {};
        this.uid               = this.uid || randomString(8);
        this.composedScope     = {};
        this.data_src          = null;
        this.current_state     = "idle";
        this.opt               = opt;
        this.eventTarget       = new EventTarget();
        this._renderScheduled  = false;

        // Reactive uiVars — setting any property auto-schedules a batched render
        this.uiVars = this._makeReactiveUiVars({});

        this.interface = PostOffice.addSocket(EventTarget, this.label());

        this._preInit();
    }

    // ─── Reactive state ───────────────────────────────────────────────────────

    _makeReactiveUiVars(initial) {
        const _this = this;
        return new Proxy(initial, {
            set(target, key, value) {
                if (target[key] === value) return true; // no render for same-value writes
                target[key] = value;
                _this._scheduleRender();
                return true;
            }
        });
    }

    // Derived state — override in subclass as a plain object of functions
    // e.g. derived = { isEmpty: uiVars => uiVars.items.length === 0 }
    _getComputedDerived() {
        if (!this.constructor.derived && !this.derived) return {};
        const derived = this.constructor.derived || this.derived;
        const result = {};
        for (const key in derived) {
            try { result[key] = derived[key](this.uiVars, this.data); } catch(e) { result[key] = undefined; }
        }
        return result;
    }

    // Store snapshot passed as 6th arg to markupFunc
    _getStoreSnapshot() {
        if (!this.stores) return {};
        const snapshot = {};
        for (const key in this.stores) {
            snapshot[key] = this.stores[key].get();
        }
        return snapshot;
    }

    // ─── Identity & logging ───────────────────────────────────────────────────

    label() { return `${this.domElName} #${this.uid}`; }

    _isDebuggable() { return this.hasAttribute("debug"); }

    _initLogging() {
        this._logPrefix = this.label() + ":";
        this._logStyle  = "font-size:12px;color:darkred";
        console.group(this._logPrefix);
    }

    _log(...args) {
        if (args[0] === "imp:") {
            console.log("imp:", `%c${this._logPrefix}`, this._logStyle, ...args.slice(1));
        } else {
            console.log(`%c${this._logPrefix}`, this._logStyle, ...args);
        }
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    _preInit() {
        this._setupDomContentLoadedCallback();
        this._setupAdvertisedInterface();
        this._subscribeToStores();
    }

    connectedCallback() {
        this.__init__(this.opt);
        if (this.onConnect) {
            this.switchToIdleState();
            this.onConnect.call(this);
        }
    }

    attributeChangedCallback() {
        this.render();
    }

    __init__(opt) {
        this._initLogging();
        this._initStateSpace();

        this.markupFunc  = this.constructor.markupFunc  || opt.markupFunc;
        this.styleMarkup = this.constructor.styleMarkup || opt.styleMarkup;
        this.processData = this.constructor.processData || opt.processData;

        if (!this.markupFunc) {
            console.warn(`Muffin [${this.domElName}]: no markupFunc — rendering skipped`);
            return;
        }

        this._composeAncestry();
        this._initLifecycle(opt);

        console.groupEnd();
    }

    _initLifecycle(opt) {
        this._initInterfaces(opt);
        this._initComponentDataSrc(opt);
        this._initRouteInterface(opt);
    }

    // ─── Stores ───────────────────────────────────────────────────────────────

    _subscribeToStores() {
        if (!this.stores) return;
        for (const key in this.stores) {
            this.stores[key].subscribe(() => this._scheduleRender());
        }
    }

    // ─── Interfaces & advertising ─────────────────────────────────────────────

    _setupDomContentLoadedCallback() {
        if (this.onDomContentLoaded) {
            document.addEventListener("DOMContentLoaded", () => this.onDomContentLoaded());
        }
    }

    _setupAdvertisedInterface() {
        if (!this.advertiseAs) return;
        this.advertisedInterface = PostOffice.getOrCreateInterface(this.advertiseAs);
        for (const key in this.LEXICON) {
            this.advertisedInterface.on(key, inflectedMsg => {
                if (this[key]) this[key].call(this, inflectedMsg);
                else console.warn(`Muffin [${this.advertiseAs}]: no method "${key}" declared in LEXICON`);
            });
        }
        this.advertisedInterface.addInterfaceSpec(this.LEXICON);
    }

    _initInterfaces(opt) {
        if (!this.interfaces) return;
        for (const key in this.interfaces) {
            PostOffice.addGlobalListener(`${this.uid}-${key}`, _msg => {
                const response = this.interfaces[key](_msg);
                PostOffice.broadcastMsg(`${_msg.sender}-${key}`, { data: response });
            });
        }
    }

    // ─── Ancestry / parent-child composition ─────────────────────────────────

    async _composeAncestry() {
        if (this._ancestryComposed) return;
        try { await DOMComponentRegistry.update(this); } catch(e) {
            console.warn(`Muffin [${this.domElName}]: ancestry composition failed —`, e);
        }

        if (!this.attributes.parent) return;
        this.parent = this.attributes.parent.value;

        if (!this.attributes.childscope) return;
        const key = this.attributes.childscope.value;

        const _compose = () => {
            const parent = this.getParent();
            if (!parent) return false;
            parent.composedScope[key] = this;
            this._ancestryComposed = true;
            parent.interface.dispatchMessage("child-composed", key);
            return true;
        };

        if (!_compose()) {
            setTimeout(() => _compose(), 1000);
        }
    }

    getParent() {
        return DOMComponentRegistry.findInstance(this.parent);
    }

    // ─── DataSource (legacy — deprecated, shim retained for backwards compat) ─

    _getCmpData() {
        const el = this.querySelector("component-data");
        if (el) console.warn(`Muffin [${this.domElName}]: <component-data> is deprecated. Use Muffin.createStore() instead.`);
        return el;
    }

    _getDomNode() {
        return document.querySelector(`[data-component='${this.uid}']`);
    }

    _initComponentDataSrc(opt) {
        if (this.data_src) return;
        const _cmpData = this._getCmpData();
        if (_cmpData) {
            this.__initDataSrcInterface(_cmpData.getAttribute("label"), _cmpData.getAttribute("socket"));
        } else {
            this.render();
        }
    }

    __initDataSrcInterface(label, socket) {
        this.data_src = DataSource.getOrCreate(label, socket, this);
        if (this.data_src) {
            Object.defineProperty(this, 'data', {
                get: () => this._postProcessCmpData(this.data_src.data)
            });
        }
        this.data_src.eventTarget.addEventListener(label, ev => this._onDataSrcUpdate(ev));
    }

    _onDataSrcUpdate() {
        this.interface.dispatchMessage("datasrc-update", { uiVars: this.uiVars, data: this.data });
        this.render();
    }

    _postProcessCmpData(newData) {
        if (this.processData) {
            try { return this.processData.call(this, newData); } catch(e) { return newData; }
        }
        return newData;
    }

    // ─── Route interface ──────────────────────────────────────────────────────

    _initRouteInterface() {
        if (!this.router) return;
        this.router._socket.on("onBeforeLoad", msg => {
            this.routeVars = msg;
            if (this.onBeforeRouteLoad) this.onBeforeRouteLoad();
        });
    }

    // ─── Compose helper (class-level) ─────────────────────────────────────────

    static _composeSelf() {
        DOMComponentRegistry.register(this.prototype.constructor);
    }

    static _compose() {
        this.prototype.constructor._composeSelf();
    }
}

// Compose setter — allows component authors to override compose with custom logic
Object.defineProperty(DOMComponent, "compose", {
    get() { return this._compose; },
    set(composeFunc) {
        this._compose = function() {
            composeFunc.call(this);
            this.prototype.constructor._composeSelf();
        };
    }
});

// Mix in renderer, event binder, state machine
Object.assign(DOMComponent.prototype, DOMRendererMethods, EventBinderMethods, StateMachineMethods);

// v2 two-way binding helper — retained for backwards compatibility
DOMComponent.prototype._binding = function(b) {
    this.element   = b.element;
    this.value     = b.object[b.property];
    this.attribute = b.attribute;
    const _this = this;
    Object.defineProperty(b.object, b.property, {
        get() { return _this.value; },
        set(val) { _this.value = val; _this.element[_this.attribute] = val; }
    });
    b.object[b.property] = this.value;
    this.element[this.attribute] = this.value;
};

export { DOMComponent, PostOffice, DataSource, DOMComponentRegistry };
