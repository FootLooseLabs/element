import { DefaultConfig } from "./config.js";
import { DOMComponentRegistry } from "./dom_component_registry.js";
import { stringToHTMLFrag, deepCountChildElements } from "./utils.js";

/**
 * DOM rendering methods mixed into DOMComponent.
 * Includes: render scheduling, esc() sanitizer, safe render-if evaluator,
 * DOM patching, style/conditional markup processing.
 */

const DOMRendererMethods = {

    // ─── Sanitization ────────────────────────────────────────────────────────

    esc(val) {
        if (val == null) return '';
        return String(val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // ─── render-if evaluator (replaces eval) ─────────────────────────────────

    _evalRenderIf(expr) {
        try {
            // Scope is limited to uiVars, data, and stores — no global access
            // eslint-disable-next-line no-new-func
            return (new Function('uiVars', 'data', 'stores', `return !!(${expr})`))
                (this.uiVars, this.data, this._getStoreSnapshot());
        } catch(e) {
            console.warn(`Muffin: render-if evaluation error for expression "${expr}" —`, e);
            return true; // fail open: show the element rather than hide it unexpectedly
        }
    },

    // ─── Render scheduling ───────────────────────────────────────────────────

    _scheduleRender() {
        if (this._renderScheduled) return;
        this._renderScheduled = true;
        queueMicrotask(() => {
            if (!this._renderScheduled) return;
            this._renderScheduled = false;
            this._doRender();
        });
    },

    // Public render() — cancels any pending microtask and fires immediately.
    // Backwards compatible: existing explicit render() calls still work.
    render() {
        this._renderScheduled = false;
        return this._doRender();
    },

    // ─── Core render ─────────────────────────────────────────────────────────

    async _doRender() {
        const stores = this._getStoreSnapshot();
        let _rendered;

        try {
            _rendered = this.markupFunc.call(
                this,
                this.data,
                this.uid,
                this.uiVars,
                this.routeVars,
                this.constructor,
                stores
            );
        } catch(e) {
            console.error(`Muffin [${this.domElName}]: markupFunc threw —`, e);
            return;
        }

        this._renderedFrag = stringToHTMLFrag(_rendered);

        this.__processRootMarkup();
        this.__processStyleMarkup();
        this.__processRenderedFragEventListeners();
        this.__patchDOM();

        DefaultConfig.DEBUG_SCOPE.debugLastRenderedCmp = this;

        if (this.postRender) this.postRender();

        return this;
    },

    // ─── Fragment preprocessing ───────────────────────────────────────────────

    __processRootMarkup() {
        this._renderedFrag.firstElementChild.dataset.component = this.uid;
        Reflect.defineProperty(this._renderedFrag.firstElementChild, "constructedFrom", { value: this });
    },

    __processStyleMarkup() {
        if (!this.styleMarkup) return;
        try {
            const _renderedStyleString = this.styleMarkup(`[data-component=${this.uid}]`, this.current_state);
            this._renderedStyle = stringToHTMLFrag(_renderedStyleString);
        } catch(e) {
            console.warn(`Muffin [${this.domElName}]: styleMarkup error —`, e);
            return;
        }
        this._renderedFrag.firstElementChild.prepend(this._renderedStyle);
    },

    __processConditionalMarkup(el) {
        if (!el) {
            this._renderedFrag.querySelectorAll("[render-if]").forEach(_el => {
                if (!this._evalRenderIf(_el.getAttribute("render-if"))) {
                    _el.style.display = "none";
                }
            });
        } else {
            if (!this._evalRenderIf(el.getAttribute("render-if"))) {
                el.style.display = "none";
            } else {
                el.style.display = "";
            }
        }
    },

    // ─── DOM patching ─────────────────────────────────────────────────────────

    __patchRootNodeAttrs(rootNode) {
        rootNode.dataset.state = this.current_state;
    },

    __patchStyle(rootNode) {
        const _indomStyle  = rootNode.querySelector('style');
        const _renderedStyle = this._renderedFrag.querySelector('style');
        if (_renderedStyle && _indomStyle && !_indomStyle.isEqualNode(_renderedStyle)) {
            _indomStyle.replaceWith(_renderedStyle);
        }
    },

    __patchUnequalAttributes(node1, node2) {
        if (node1.attributes === node2.attributes) return;
        Array.from(node1.attributes).forEach(attr => {
            if (!node2.attributes[attr.name]) {
                node2.setAttribute(attr.name, attr.value);
            } else if (node2.getAttribute(attr.name) !== attr.value) {
                node2.setAttribute(attr.name, attr.value);
            }
        });
    },

    __isDOMTreeEqual(node1, node2) {
        if (node1.childElementCount !== node2.childElementCount) return false;
        if (deepCountChildElements(node1) !== deepCountChildElements(node2)) return false;

        for (let i = 0; i < node1.children.length; i++) {
            const c1 = node1.children[i];
            const c2 = node2.children[i];
            if (c1.constructedFrom || c2.constructedFrom) continue;
            if (c1.childElementCount !== c2.childElementCount) return false;
        }
        return true;
    },

    async __findAndReplaceUnequalNodes(root1, root2) {
        if (root2.hasAttribute("render-if")) {
            this.__processConditionalMarkup(root2);
        }

        this.__patchUnequalAttributes(root1, root2);

        if (root1.children.length === 0 || root2.children.length === 0) {
            root2.replaceWith(root1);
            return;
        }

        Array.from(root1.children).forEach((_root1Child, idx) => {
            const _root2Child = root2.children[idx];
            if (!_root2Child) return;

            if (_root1Child.isEqualNode(_root2Child)) return;
            if (_root2Child.attributes.renderonlyonce) return;

            if (_root2Child.hasOwnProperty("constructedFrom")) {
                if (_root1Child.attributes.volatile) {
                    _root2Child.replaceWith(_root1Child);
                }
                return;
            }

            if (!this.__isDOMTreeEqual(_root1Child, _root2Child)) {
                _root2Child.replaceWith(_root1Child);
            } else {
                this.__findAndReplaceUnequalNodes(_root1Child, _root2Child);
            }
        });
    },

    __patchDOMCompletely(cmpDomNode, indom = false) {
        this.__processConditionalMarkup();

        if (indom && location.href === this._patchDomRouteToken) {
            this._processChildCmps();
        }

        cmpDomNode.replaceWith(this._renderedFrag);
    },

    __patchDOM() {
        if (this.attributes.stop) {
            DefaultConfig.DEBUG_SCOPE.stoppedCmp = this;
            return;
        }

        const in_dom = this._getDomNode();
        const cmpDomNode = in_dom || this;

        try {
            const _renderedFragRoot = this._renderedFrag.firstElementChild;

            if (cmpDomNode.isEqualNode(_renderedFragRoot)) return;

            if (in_dom) {
                this.__patchRootNodeAttrs(cmpDomNode);
                if (cmpDomNode.attributes.renderonlyonce) {
                    this.__patchStyle(cmpDomNode);
                    return;
                }
                if (this.__isDOMTreeEqual(cmpDomNode, _renderedFragRoot)) {
                    this.__findAndReplaceUnequalNodes(_renderedFragRoot, cmpDomNode);
                } else {
                    this.__patchDOMCompletely(cmpDomNode, true);
                }
            } else {
                this.__patchDOMCompletely(cmpDomNode);
            }
        } catch(e) {
            console.error(`Muffin [${this.domElName}]: DOM patch failed —`, e);
        }

        this._patchDomRouteToken = location.href;
    },

    // ─── Child component handling ─────────────────────────────────────────────

    _getChildCmps() {
        const node = this._getDomNode();
        return node ? Array.from(node.querySelectorAll('[data-component]')) : [];
    },

    _processChildCmps() {
        const childCmpsInDOM = this._getChildCmps();
        if (!childCmpsInDOM.length) return;

        const selector = DOMComponentRegistry.list().map(e => e.name).join(",");
        if (!selector) return;

        const childCmpsInFrag = this._renderedFrag.querySelectorAll(selector);

        childCmpsInFrag.forEach(_fragChild => {
            const _domChild = childCmpsInDOM.find(c =>
                c.constructedFrom?.domElName === _fragChild.tagName.toLowerCase()
            );
            if (_domChild) _fragChild.replaceWith(_domChild);
        });
    }
};

export { DOMRendererMethods };
