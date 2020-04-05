import { randomString } from "./utils.js";

class PostOffice extends Object {

	// constructor() {
	// 	this.registry = [];
	// }


	static addSocket(name, _url) {
		PostOffice.sockets[name] = new WebSocket(_url);
	}

	static _getRegistry() {
		return PostOffice.registry;
	}

	static _addToRegistry(_broker) {
		PostOffice.registry.push(_broker);
	}

	static _delFromRegistry(_broker) {

	}

	static getDefaultScope (){
		return window;
	}

	static _getBroker (label, scope) {
		var scope = scope || PostOffice.getDefaultScope();
		return PostOffice._getRegistry().filter((_broker) => {
			return _broker.label == label && _broker.scope == scope;
		})[0];
	}

	static _createBroker (label, _cb, scope) {
		var scope = scope || PostOffice.getDefaultScope();
		var _broker = new PostOffice.Broker(label, _cb, scope);
		return _broker;
	}

	static _createOrUpdateBroker(label, _cb, scope){
		var _broker = PostOffice._getBroker(label, scope);
		if(_broker){
			_broker.addCallback(_cb)
		}else{
			PostOffice._addToRegistry(PostOffice._createBroker(label, _cb, scope));
		}
	}

	static registerBroker (_thisArg, label,_cb,scope){
		if(!label){return;}
		var scope = scope || PostOffice.getDefaultScope();
		PostOffice._createOrUpdateBroker(label, _cb, scope);
	}


	static _runBroker (label, msg, _scope) {
		var _broker = PostOffice._getBroker(label, _scope);
		if(!_broker){
			console.log("no broker registered for - ", label);
			return;
		}
		_broker.execute(msg);
	}

	static broadcastMsg (label, msg, _scope){
		  if(!label){return;}
		  var _scope = _scope || PostOffice.getDefaultScope();
		  var evnt = new CustomEvent(label, {
		      detail: msg
		    });
		  _scope.dispatchEvent(evnt);
		  PostOffice._runBroker(label,msg, _scope);
		}

	static runViaWorker({targetFunc, label, args} = {}) {
		var trigger = `self.onmessage = function(msgEv){
			if(msgEv.data == "start"){
				var result = ${targetFunc()}
				postMessage(result);
			}
		}` 
		var blob = new Blob([targetFunc],{type: 'text/javascript'});
		PostOffice.workers.label = new Worker(window.URL.createObjectURL(blob));
	}

	static _startWorker() {
		console.log("imp:", "starting PostOffice worker...");
	  	if (typeof(Worker) !== "undefined") {
		    if(!(PostOffice.worker)) {
	    		PostOffice._worker = new Worker(MuffinConfig.POST_OFFICE_WORKER_URL)
	    		PostOffice._worker.onerror = () => {
	    				console.log("imp:", "webworker couldn't be initialised. check MuffinConfig.POST_OFFICE_WORKER_URL");
	    				PostOffice._worker = null;
	    				return;
	    			}
		    }
		} else {
		    console.log("imp:", "webworker support not available. running PostOffice without worker.");
		}

		if(PostOffice._worker) {
			PostOffice._worker.onmessage = function(msgEv) {
				if(msgEv.data == "pong"){
    				PostOffice.worker = PostOffice._worker;
    				console.log("imp:", "PostOffice worker started.");
    				return;
    			}
    			console.log("imp:","From PostOffice Worker - ");
		    	console.dir(msgEv);
		    	if(msgEv.data.error){
		    		console.log("imp:", "From PostOffice Worker - ", msgEv.data.error);
		    		return;
		    PostOffice.worker.postMessage(data);	}
		    	PostOffice.broadcastMsg(msgEv.data.label, msgEv.data.msg);
		    };

		    PostOffice._worker.postMessage("ping");
		}
	}

	static _registerWorkerBroker() {
		PostOffice.registerBroker(this,"worker-task", (data)=>{
			// PostOffice.worker.postMessage(data);
			// PostOffice.runViaWorker();
		})
	}

	static start() {
		if(PostOffice.started){
			console.log("PostOffice already started");
			return;
		}
		PostOffice._registerWorkerBroker();
		// PostOffice._startWorker();
		// PostOffice.started = true;
	}
}

PostOffice.sockets = {};
PostOffice.registry = [];
PostOffice.worker = null;
PostOffice.workers = {};
PostOffice.Broker = class PostOfficeBroker {
							constructor(_label, _cb, _scope) {
								this.label = _label;
								this.scope = _scope;
								this.callbacks = [];
								this.addCallback(_cb);
							}

							_getScope() {
								return document.querySelector(this.scope) || PostOffice.getDefaultScope();
							}

							addCallback (_cb) {
								var _this = this;
								this.callbacks.push(_cb);
								// (this._getScope()).addEventListener(_this.label, _this.execute);
							}

							execute (msg) {
								this.callbacks.forEach((_cb, idx)=>{
									console.log("broker executing callback - ", idx);
									_cb(msg);
								});
							}
					}


export {
	PostOffice
}