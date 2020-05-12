window.LOGGING_LEVEL = "NODEBUG";
window.TRASH_SCOPE = {};

window.MUFFIN_CONFIG = {
	"LOGGING_LEVEL" : "IMP",
	"POST_OFFICE_WORKER_URL": "muffin_po_worker.js"
};
window.Muffin = {};

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

window.Muffin.Router = Router;
window.Muffin.PostOffice = PostOffice;
window.Muffin.DOMComponentRegistry = DOMComponentRegistry;
window.Muffin.DataSource = DataSource;
window.Muffin.DOMComponent = DOMComponent;

window.Router = Router;
window.PostOffice = PostOffice;
window.DOMComponentRegistry = DOMComponentRegistry;
window.DataSource = DataSource;
window.DOMComponent = DOMComponent;
// window.IncludeFrag = IncludeFrag;