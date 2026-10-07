import { DefaultConfig } from "./config.js";
import { DOMComponentRegistry } from "./dom_component_registry.js";
import { stringToHTMLFrag } from "./utils.js";

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
            // `this` (component instance) available for v2-style expressions like this.uiVars.x
            // Named params uiVars/data/stores also available for shorter v3-style expressions
            // eslint-disable-next-line no-new-func
            return (new Function('uiVars', 'data', 'stores', `return !!(${expr})`))
                .call(this, this.uiVars, this.data, this._getStoreSnapshot());
        } catch(e) {
            console.warn(`Muffin: render-if evaluation error for expression "${expr}" —`, e);
            return true; // fail open: show the element rather than hide it unexpectedly
        }
    },

    // ─── Render scheduling ───────────────────────────────────────────────────

    _scheduleRender() {
        if (!this.markupFunc) return;
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
        if (!this.markupFunc) return;
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
        this.__stampRenderedAttrs();
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

        // Apply/update attributes present in the new render.
        Array.from(node1.attributes).forEach(attr => {
            if (node2.getAttribute(attr.name) !== attr.value) {
                node2.setAttribute(attr.name, attr.value);
            }
        });

        // Remove attributes the previous render produced but this render no longer does
        // (e.g. a conditional `disabled`). Attributes set imperatively — toggleRootAttr,
        // toggleBtnBusyState, app code — were never in a render, so they are left alone.
        // data-state is set by the framework, never by markupFunc, so it is never stamped.
        const previouslyRendered = node2.__renderedAttrs;
        if (previouslyRendered) {
            for (const name of previouslyRendered) {
                if (name !== 'data-state' && !node1.hasAttribute(name) && node2.hasAttribute(name)) {
                    node2.removeAttribute(name);
                }
            }
        }
        node2.__renderedAttrs = node1.__renderedAttrs;
    },

    // Record, on every element of the new render, which attributes markupFunc produced.
    // A live node carries the stamp of the render it was patched from, so the patcher can
    // tell rendered attributes (removable) from ones set imperatively (kept).
    __stampRenderedAttrs() {
        for (const el of this._renderedFrag.querySelectorAll('*')) {
            el.__renderedAttrs = el.getAttributeNames();
        }
    },

    __isDOMTreeEqual(node1, node2) {
        if (node1.childElementCount !== node2.childElementCount) return false;

        for (let i = 0; i < node1.children.length; i++) {
            const c1 = node1.children[i];
            const c2 = node2.children[i];
            // Skip child Muffin components — they manage their own DOM subtree.
            // The old deepCountChildElements check incorrectly counted across component
            // boundaries (unrendered tag = 0 children, rendered output = N children),
            // always forcing a full replacement when any child component was present.
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
            // A field the user is typing in is kept in place (attributes were patched above)
            // so its value, caret and IME state survive. Anything else is replaced; focus
            // returns to the replacement if it is the same control.
            if (root2 === document.activeElement &&
                this.__isEditable(root2) && root1.tagName === root2.tagName) {
                return;
            }
            this.__replacePreservingFocus(root2, root1);
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
                // Recurse instead of replacing only to protect a field the user is typing in,
                // and only between nodes of the same tag. Recursing for any focused element
                // (e.g. a just-clicked button) patched unrelated markup into the old nodes and
                // left the focused node grafted into the new view.
                const active = document.activeElement;
                if (_root2Child.contains(active) && this.__isEditable(active) &&
                    _root1Child.tagName === _root2Child.tagName) {
                    this.__findAndReplaceUnequalNodes(_root1Child, _root2Child);
                } else {
                    this.__replacePreservingFocus(_root2Child, _root1Child);
                }
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

        // Full swap: snapshot focus first, then return it to the same control in the new tree.
        const focus   = this.__captureFocus(cmpDomNode);
        const newRoot = this._renderedFrag.firstElementChild;
        cmpDomNode.replaceWith(this._renderedFrag);
        this.__restoreFocus(focus, newRoot);
    },

    // ─── Focus preservation across node swaps ────────────────────────────────

    __isEditable(el) {
        if (!el) return false;
        const tag = el.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
    },

    // If focus lives inside `container`, record where (child-index path) and, for
    // editable fields, the value and selection.
    __captureFocus(container) {
        const active = document.activeElement;
        if (!active || active === document.body || !container.contains(active)) return null;

        const path = [];
        for (let node = active; node !== container; node = node.parentElement) {
            path.unshift(Array.prototype.indexOf.call(node.parentElement.children, node));
        }

        const snapshot = { active, path, editable: this.__isEditable(active) };
        if (snapshot.editable && 'value' in active) {
            snapshot.value = active.value;
            try { snapshot.selection = [active.selectionStart, active.selectionEnd]; } catch(_) {}
        }
        return snapshot;
    },

    // Return focus to the node at the same path in `newRoot` — but only if it is the
    // same control (same tag; for non-editables also the same on-click handler).
    // Otherwise focus is left where the browser put it rather than jumping to an unrelated node.
    __restoreFocus(snapshot, newRoot) {
        if (!snapshot || !newRoot || !newRoot.isConnected) return;
        if (snapshot.active.isConnected) return; // focused node survived — nothing was lost

        let target = newRoot;
        for (const idx of snapshot.path) {
            target = target.children[idx];
            if (!target) return;
        }
        if (target.tagName !== snapshot.active.tagName) return;
        if (!snapshot.editable &&
            target.getAttribute('on-click') !== snapshot.active.getAttribute('on-click')) return;

        if (snapshot.value !== undefined && 'value' in target) target.value = snapshot.value;
        target.focus({ preventScroll: true });
        if (snapshot.selection && snapshot.selection[0] != null) {
            try { target.setSelectionRange(snapshot.selection[0], snapshot.selection[1]); } catch(_) {}
        }
    },

    __replacePreservingFocus(oldNode, newNode) {
        const focus = this.__captureFocus(oldNode);
        oldNode.replaceWith(newNode);
        this.__restoreFocus(focus, newNode);
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
            // Only preserve named (childscoped) child components.
            // Components without childscope (e.g. leaf/presentational components like
            // lucide-icon) are cheap to recreate and have no parent-managed scope slot —
            // trying to preserve them by domElName alone incorrectly maps every instance
            // of the same type to the same first DOM node.
            const fragScope = _fragChild.getAttribute('childscope');
            if (!fragScope) return;

            const _domChild = childCmpsInDOM.find(c =>
                c.constructedFrom?.domElName === _fragChild.tagName.toLowerCase() &&
                c.constructedFrom?.getAttribute('childscope') === fragScope
            );
            if (_domChild) _fragChild.replaceWith(_domChild);
        });
    }
};

export { DOMRendererMethods };
