/**
 * Event binding methods mixed into DOMComponent.
 * Wires on-click / on-change / on-input etc. attributes to component methods.
 */

const EVENT_ATTRS = [
    { attr: "on-change",      event: "onchange"      },
    { attr: "on-input",       event: "oninput"        },
    { attr: "on-click",       event: "onclick"        },
    { attr: "on-scroll",      event: "onscroll"       },
    { attr: "on-keyup",       event: "onkeyup"        },
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
                }
            });
        });
    }
};

export { EventBinderMethods };
