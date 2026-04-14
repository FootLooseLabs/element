import { DefaultConfig } from "./config.js";
import { Logger } from "./logger.js";
import { Lexeme } from "./lexeme.js";
import { DataChannel } from "./data_component.js";
import { DOMComponentRegistry, DataSource, PostOffice, DOMComponent } from "./dom_component.js";
import { Router } from "./router.js";
import { IncludeFrag } from "./include.js";
import { Introspector } from "./introspector.js";
import { createStore } from "./store.js";

Logger.start();
DOMComponentRegistry.start();
Introspector.start();

DOMComponentRegistry.register(DataChannel);
DOMComponentRegistry.register(IncludeFrag);

// Single global namespace — no bare globals polluting window
window.Muffin = {
    Lexeme,
    Router,
    PostOffice,
    DOMComponentRegistry,
    DataSource,
    DOMComponent,
    Introspector,
    createStore
};

// Named exports for ES module / bundler usage (atom-websdk, Vite projects)
export {
    Lexeme,
    Router,
    PostOffice,
    DOMComponentRegistry,
    DataSource,
    DOMComponent,
    Introspector,
    createStore
};
