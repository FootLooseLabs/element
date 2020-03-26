window.LOGGING_LEVEL = "NODEBUG";
window.TRASH_SCOPE = {};

(() => {
	var __log = console.log;
	console.log = function() {
		if(arguments[0]==="imp:"){__log.apply(this, arguments);}
		if(window.LOGGING_LEVEL !== "DEBUG"){return;}
    	__log.apply(this, arguments);
	}
})();

import { DOMComponentRegistry, DataSource, PostOffice, DOMComponent } from "./dom_component.js";
import { Router } from "./router.js";
import { IncludeFrag } from "./include.js";

DOMComponentRegistry.start();
window.Router = Router;
window.PostOffice = PostOffice;
window.DOMComponentRegistry = DOMComponentRegistry;
window.DataSource = DataSource;
window.DOMComponent = DOMComponent;