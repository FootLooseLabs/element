window.LOGGING_LEVEL = "NODEBUG";
window.TRASH_SCOPE = {};

(() => {
	var __log = console.log;
	console.log = function() {
		if(window.LOGGING_LEVEL == "NONE"){return;}

		if(arguments[0]==="imp:"){
			var argumentsArr = Array.prototype.slice.call(arguments);
			var msgArr = argumentsArr.slice(1,argumentsArr.length)
			__log.apply(this, msgArr);
		}
		if(window.LOGGING_LEVEL !== "DEBUG"){return;}
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
window.Router = Router;
window.PostOffice = PostOffice;
window.DOMComponentRegistry = DOMComponentRegistry;
window.DataSource = DataSource;
window.DOMComponent = DOMComponent;
// window.IncludeFrag = IncludeFrag;