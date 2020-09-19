import { DefaultConfig } from "./config.js";
import { Logger } from "./logger.js";
import { Lexeme } from "./lexeme.js";
import { DataChannel } from "./data_component.js";
import { DOMComponentRegistry, DataSource, PostOffice, DOMComponent } from "./dom_component.js";
import { Router } from "./router.js";
import { IncludeFrag } from "./include.js";
import { Introspector } from "./introspector.js";

// Object.prototype.register = function(){ 
// 	if(!(this.prototype instanceof DOMComponent)){return;}
// 	DOMComponentRegistry.register(this);
// }

window.Muffin = {};

Logger.start();
DOMComponentRegistry.start();
Introspector.start();


DOMComponentRegistry.register(DataChannel)
DOMComponentRegistry.register(IncludeFrag)

window.Muffin.Lexeme = Lexeme;
window.Muffin.Router = Router;
window.Muffin.PostOffice = PostOffice;
window.Muffin.DOMComponentRegistry = DOMComponentRegistry;
window.Muffin.DataSource = DataSource;
window.Muffin.DOMComponent = DOMComponent;
window.Muffin.Introspector = Introspector;

window.Router = Router;
window.PostOffice = PostOffice;
window.DOMComponentRegistry = DOMComponentRegistry;
window.DataSource = DataSource;
window.DOMComponent = DOMComponent;
// window.IncludeFrag = IncludeFrag;
