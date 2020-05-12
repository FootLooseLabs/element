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
		DOMComponentRegistry.components.push({name:webComp.domElName, error: webComp.error, instances: []});
		PostOffice.broadcastMsg(DOMComponentRegistry.brokerLabel(),{name: webComp.domElName}, document);
	}
	static list(){
		return this.components;
	}

	static findInstance(uid) {
	  	var parent = null;
	    var entry = DOMComponentRegistry.list().find(_entry => {
	      parent = _entry.instances.find((_instance)=>{
	      	return _instance.uid == uid;
	      });
	      return parent;
	    });

	    return parent;
	}

	static find(domElName){
		return DOMComponentRegistry.list().find((_entry)=>{
			return _entry.name == domElName;
		})
	}

	static register(webComp) {
		if(typeof webComp.domElName == "function"){
			var webCompDomName = webComp.domElName();
		}else{
			var webCompDomName = webComp.domElName;
		}
		try{
			customElements.define(webCompDomName, webComp);
		}catch(e){
			webComp.error = e;
			console.log("imp:", e);
		}
		DOMComponentRegistry.add(webComp);
		// if(webComp.register){
		// 	webComp.register();
		// }
	}

	static update(instance) {
		var _entry = DOMComponentRegistry.find(instance.domElName);
		if(_entry){
			_entry.instances.push(instance);
		}
	}
}

DOMComponentRegistry.components = [];

export {
	DOMComponentRegistry
}