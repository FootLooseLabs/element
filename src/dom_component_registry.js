import { PostOffice } from "./post_office.js";

class DOMComponentRegistry {
	static brokerLabel (){return "NewComponentRegistry";}

	static start() {
		if(DOMComponentRegistry.started){
			console.log("DOMComponentRegistry already started");
			return;
		}
		PostOffice.registerBroker(this, DOMComponentRegistry.brokerLabel(), (ev)=> {
			console.log("registering new component - ", ev.detail);
			// customElements.define(e.detail.name, e.detail._constructor);
		});
		// console.log("imp:", "REGISTERED BROKER === ", DOMComponentRegistry.brokerLabel);
		DOMComponentRegistry.started = true;
	}

	static add(webComp){
		// customElements.define(webComp.domElName, webComp);
		DOMComponentRegistry.components.push({name:webComp.domElName, uid: webComp.uid});
		PostOffice.broadcastMsg(DOMComponentRegistry.brokerLabel(),{name: webComp.domElName}, document);
	}
	static list(){
		return this.components;
	}

	static register(webComp) {
		if(typeof webComp.domElName == "function"){
			var webCompDomName = webComp.domElName();
		}else{
			var webCompDomName = webComp.domElName;
		}
		customElements.define(webCompDomName, webComp);
		DOMComponentRegistry.add(webComp);
	}
}

DOMComponentRegistry.components = [];

export {
	DOMComponentRegistry
}