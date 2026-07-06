/**
 * Event binding methods mixed into DOMComponent.
 * Wires on-click / on-change / on-input etc. attributes to component methods.
 */

const EVENT_ATTRS = [
    { attr: "on-change",      event: "onchange"      },
    { attr: "on-input",       event: "oninput"        },
    { attr: "on-click",       event: "onclick"        },
    { attr: "on-dblclick",    event: "ondblclick"     },
    { attr: "on-scroll",      event: "onscroll"       },
    { attr: "on-keydown",     event: "onkeydown"      },
    { attr: "on-keyup",       event: "onkeyup"        },
    { attr: "on-focus",       event: "onfocus"        },
    { attr: "on-blur",        event: "onblur"         },
    { attr: "on-load",        event: "onload"         },
    { attr: "on-contextmenu", event: "oncontextmenu"  }
];

const EventBinderMethods = {

    __processRenderedFragEventListeners() {
        const _this = this;

        EVENT_ATTRS.forEach(({ attr, event }) => {
            this._renderedFrag.querySelectorAll(`[${attr}]`).forEach(el => {
                const methodName = el.getAttribute(attr);
                if (event === "oncontextmenu") {
                    el[event] = function(ev) {
                        ev.preventDefault();
                        if (_this[methodName]) _this[methodName].call(_this, el, ev);
                        else console.warn(`Muffin: no method "${methodName}" on component`);
                    };
                } else {
                    el[event] = function(ev) {
                        if (_this[methodName]) _this[methodName].call(_this, el, ev);
                        else console.warn(`Muffin: no method "${methodName}" on component`);
                    };
                    // For cached images the browser fires `load` before the handler is
                    // attached (el.complete is already true at fragment creation time).
                    // Only fire synthetically on the FIRST render (component not yet in
                    // the live DOM). On re-renders the img is already in the DOM and
                    // its real load event will have already fired; firing again every
                    // re-render would re-invoke the handler and trigger an infinite
                    // render loop via uiVars (uiVars has no dirty-check).
                    if (event === "onload" && el.complete === true && !_this._getDomNode()) {
                        el[event](new Event('load'));
                    }
                }
            });
        });
    }
};

export { EventBinderMethods };
