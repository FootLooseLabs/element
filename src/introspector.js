import { DefaultConfig } from "./config.js";

var Introspector = {};
Introspector.initPort = (msgEv) => {
	if(DefaultConfig.INTROSPECT!=true){return;}
	Introspector.port2 = msgEv.ports[0];
	if(!Introspector.port2){
		return;
	}
	Introspector.port2.onmessage = () => {
		if(DefaultConfig.INTROSPECT!=true){return;}
		var introspectObj = [];
		DOMComponentRegistry.list().forEach((_entry)=>{
			_entry.instances.forEach((instance)=>{
				var introspectableInstance = {
					name:instance.domElName, 
					uid:instance.uid, 
					stateSpace:instance.stateSpace,
					current_state: instance.current_state
				};
				introspectObj.push(introspectableInstance);
			});
		});
		console.log("imp:"," - DEBUGGER MSG - ", msgEv)
    	Introspector.port2.postMessage(introspectObj);
    };
}
Introspector.start = ()=> {
	if(DefaultConfig.INTROSPECT!=true){return;}
	window.onmessage = function(msgEv){
		if(DefaultConfig.INTROSPECT!=true){return;}
		console.log("imp:","initializing port", msgEv);
		Introspector.initPort(msgEv);
	}
	console.log("imp:","STARTED MUFFIN DEBUGGER");
}

export {
	Introspector
}