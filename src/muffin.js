window.LOGGING_LEVEL = "NODEBUG";
window.TRASH_SCOPE = {};

window.MUFFIN_CONFIG = {
	"LOGGING_LEVEL" : "IMP",
	"POST_OFFICE_WORKER_URL": "muffin_po_worker.js"
};
window.muffin = {};

import { Logger } from "./logger.js";
import { DOMComponentRegistry, DataSource, PostOffice, DOMComponent } from "./dom_component.js";
import { Router } from "./router.js";
import "./include.js";

// Object.prototype.register = function(){ 
// 	if(!(this.prototype instanceof DOMComponent)){return;}
// 	DOMComponentRegistry.register(this);
// }

Logger.start();
DOMComponentRegistry.start();

window.muffin.Router = Router;
window.muffin.PostOffice = PostOffice;
window.muffin.DOMComponentRegistry = DOMComponentRegistry;
window.muffin.DataSource = DataSource;
window.muffin.DOMComponent = DOMComponent;

window.Router = Router;
window.PostOffice = PostOffice;
window.DOMComponentRegistry = DOMComponentRegistry;
window.DataSource = DataSource;
window.DOMComponent = DOMComponent;
// window.IncludeFrag = IncludeFrag;