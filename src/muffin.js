window.LOGGING_LEVEL = "NODEBUG";
window.TRASH_SCOPE = {};

window.MUFFIN_CONFIG = {
	"LOGGING_LEVEL" : "IMP",
	"POST_OFFICE_WORKER_URL": "muffin_po_worker.js",
	"INTROSPECT": true
};
window.Muffin = {};

import { Logger } from "./logger.js";
import { DataChannel } from "./data_component.js";
import { DOMComponentRegistry, DataSource, PostOffice, DOMComponent } from "./dom_component.js";
import { Router } from "./router.js";
import { IncludeFrag } from "./include.js";
import { Introspector } from "./introspector.js";

// Object.prototype.register = function(){ 
// 	if(!(this.prototype instanceof DOMComponent)){return;}
// 	DOMComponentRegistry.register(this);
// }

Logger.start();
DOMComponentRegistry.start();
Introspector.start();


DOMComponentRegistry.register(DataChannel)
DOMComponentRegistry.register(IncludeFrag)


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
