window.muffinDebugger = {};
window.muffinDebugger.initPort = (msgEv) => {
	muffinDebugger.port2 = msgEv.ports[0];
	muffinDebugger.port2.onmessage = () => {
		var introspectObj = [];
		DOMComponentRegistry.list().forEach((_entry)=>{
			_entry.instances.forEach((instance)=>{
				var introspectableInstance = {name:instance.domElName, uid:instance.uid, stateSpace:instance.stateSpace};
				introspectObj.push(introspectableInstance);
			});
		});
		console.log("imp:"," - DEBUGGER MSG - ", msgEv)
    	muffinDebugger.port2.postMessage(introspectObj);
    };
}
window.muffinDebugger.start = ()=> {
	window.onmessage = function(msgEv){
		console.log("imp:","initializing port", msgEv);
		muffinDebugger.initPort(msgEv);
	}
	console.log("imp:","STARTED MUFFIN DEBUGGER");
}
muffinDebugger.start();