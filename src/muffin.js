window.TRASH_SCOPE = {};
window.MuffinConfig = {
	"LOGGING_LEVEL" : "IMP",
	"POST_OFFICE_WORKER_URL": "muffin_po_worker.js"
};

(() => {
	var __log = console.log;
	console.log = function() {
		if(MuffinConfig.LOGGING_LEVEL == "NONE"){return;}

		if(arguments[0]==="imp:"){
			var argumentsArr = Array.prototype.slice.call(arguments);
			var msgArr = argumentsArr.slice(1,argumentsArr.length)
			__log.apply(this, msgArr);
		}
		if(MuffinConfig.LOGGING_LEVEL !== "DEBUG"){return;}
    	__log.apply(this, arguments);
	}
})();


import { DOMComponentRegistry, DataSource, PostOffice, DOMComponent } from "./dom_component.js";
import { Router } from "./router.js";
import "./include.js";

// Object.prototype.register = function(){ 
// 	if(!(this.prototype instanceof DOMComponent)){return;}
// 	DOMComponentRegistry.register(this);
// }

DOMComponentRegistry.start();
PostOffice.start();

window.Router = Router;
window.PostOffice = PostOffice;
window.DOMComponentRegistry = DOMComponentRegistry;
window.DataSource = DataSource;
window.DOMComponent = DOMComponent;
// window.IncludeFrag = IncludeFrag;