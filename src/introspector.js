var Introspector = {};
Introspector.initPort = (msgEv) => {
	if(MUFFIN_CONFIG.INTROSPECT!=true){return;}
	Introspector.port2 = msgEv.ports[0];
	if(!Introspector.port2){
		return;
	}
	Introspector.port2.onmessage = () => {
		if(MUFFIN_CONFIG.INTROSPECT!=true){return;}
		var introspectObj = [];
		DOMComponentRegistry.list().forEach((_entry)=>{
			_entry.instances.forEach((instance)=>{
				var introspectableInstance = {name:instance.domElName, uid:instance.uid, stateSpace:instance.stateSpace};
				introspectObj.push(introspectableInstance);
			});
		});
		console.log("imp:"," - DEBUGGER MSG - ", msgEv)
    	Introspector.port2.postMessage(introspectObj);
    };
}
Introspector.start = ()=> {
	if(MUFFIN_CONFIG.INTROSPECT!=true){return;}
	window.onmessage = function(msgEv){
		console.log("imp:","initializing port", msgEv);
		Introspector.initPort(msgEv);
	}
	console.log("imp:","STARTED MUFFIN DEBUGGER");
}

export {
	Introspector
}