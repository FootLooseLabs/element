class PostOffice extends Object {

	// constructor() {
	// 	this.registry = [];
	// }

	// static defaultScope = PostOffice.addSocket(EventTarget,"global");

	static addSocket(_constructor, name, _url) {
		PostOffice.sockets[name] = new PostOffice.Socket(_constructor, name, _url);
		return PostOffice.sockets[name];
	}

	static createInterface(name,specs, override) {
		if(PostOffice.sockets[name] && !override){
			let err = `Error: Interface with name = ${name} already exists.`;
			throw Error(err);
		}
		PostOffice.sockets[name] = new PostOffice.Socket(EventTarget, name);

		if(specs){
			PostOffice.sockets[name].addInterfaceSpec(specs);
		}
		return PostOffice.sockets[name];
	}

	static getOrCreateInterface(name,specs) {
		if(PostOffice.sockets[name]){
			return PostOffice.sockets[name];
		}
		PostOffice.sockets[name] = new PostOffice.Socket(EventTarget, name);

		if(specs){
			PostOffice.sockets[name].addInterfaceSpec(specs);
		}
		return PostOffice.sockets[name];
	}

	static publishToInterface(targetInterfaceAddr, msg) {
		var [interfaceSocketName, interfaceOpLabel] = targetInterfaceAddr.split(":::");
		console.debug("publishToInterface - ", interfaceSocketName, interfaceOpLabel, msg);
		let targetSocket = PostOffice.sockets[interfaceSocketName];
		if(!targetSocket){
			let err = `Error: No such interface - ${interfaceSocketName}`;
			throw Error(err);
		}
		targetSocket.publish(interfaceOpLabel, msg);
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
		return PostOffice.defaultScope;
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

	// static registerBroker(label,_cb,scope){  //legacy code - comments kept for referece in case anything breaks
	// 	if(!label){return;}
	// 	var scope = scope || PostOffice.getDefaultScope();
	// 	PostOffice._createOrUpdateBroker(label, _cb, scope);
	// }

	static addGlobalListener(_label,_cb){ //new version - refer to older version in case of fallacies
		return PostOffice.sockets.global.addListener(_label, _cb);
	}

	// static addListener(label,_cb,scope){
	// 	if(!label){return;}
	// 	var scope = scope || PostOffice.getDefaultScope();
	// 	PostOffice._createOrUpdateBroker(label, _cb, scope);
	// }


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
}

PostOffice.sockets = {};
PostOffice.registry = [];

PostOffice.Socket = class PostOfficeSocket {
	constructor(_constructor, name, url, options) {
		var options = options || {};
		this.constructedFrom = _constructor || WebSocket;
		this.name = name;
		this.url = url;
		this.socket = new this.constructedFrom(url);
		this.defaultScope = new EventTarget();
		this.listeners = [];
		this.autoRetryOnClose = true;
		this.autoRetryInterval = 5;
		this.autoInitLexiconSubscriptions = options.autoInitLexiconSubscriptions || true;
		this.__init__();
	}

	_initLexiconSubscriptions() {
		// console.debug("PostOffice ---- _initLexiconSubscriptions : start ----------------", this.INTERFACE_SPEC);

		if(this.INTERFACE_SPEC){
			// console.debug("PostOffice ---- _initLexiconSubscriptions : initialising LEXICON Subscriptions ----------------");
			for(var key in this.INTERFACE_SPEC){
				if(this.INTERFACE_SPEC[key]){
					if(this.INTERFACE_SPEC[key].schema && this.INTERFACE_SPEC[key].schema.subscribe){
						// let _inflection = LEXICON.RORStateSubscriptionRequest.inflect({});
				        // console.debug("-- SEnding MSg", _inflection.get())

				        console.debug(`PostOffice:::_initLexiconSubscriptions publishing ${key}`);
				        this.publish(`${key}`, {});
					}
				}else{
					console.warn(`PostOffice:::${this.name}: _initLexiconSubscriptions Key - ${key} in Spec has undefined value. (No lexeme associated with the key).`);
				}
			}
		}
	}

	__init__() {
		var _this = this;
		// PostOffice.sockets[name] = new WebSocket(_url);
		// PostOffice.sockets[name].proxy = {};
		// this.socket.
		if(this.socket instanceof WebSocket){
			this._keepAlive();
		}

	  	this.socket.addEventListener("message", (msgEv)=>{
	  		_this._handleSocketMsgEv.call(_this, msgEv)
	  	});

	  	this.socket.addEventListener("close", (ev)=>{
	  		_this._handleSocketCloseEv.call(_this, ev);
	  	});

	  	this.socket.addEventListener("open", (ev)=>{
	  		_this._handleSocketOpenEv.call(_this, ev);
	  	});

	  	this.socket.addEventListener("error", (ev)=>{
	  		_this._handleSocketErrorEv.call(_this, ev);
	  	});

		// if(this.autoInitLexiconSubscriptions){
		// 	this._initLexiconSubscriptions();
		// }

	  	this.on = this.addListener;
	}

	_keepAlive() {
		var _this = this;
		clearInterval(this.connectionKeepAlive);
        this.connectionKeepAlive = setInterval(()=>{
        	if(_this.keepAlive != true){return;}
            _this.send("ping");
        },59000);
	}

	onmessage(socketMsgEv) { //custom onmessage functions can be provided by the developer.
		var _msgStr = socketMsgEv.data;
		if(_msgStr=="pong"){return;} //ping-pong messages exchanged in keepAlive
		var ev = null;
		try{
  			var _msg = JSON.parse(_msgStr);
	  		ev = new CustomEvent(_msg.label, {
				detail: _msg
			});
  		}catch(e){ //not valid msg
  			var _msg = {error: e, label: `${this.name}-message-error`}
  			ev = new CustomEvent(_msg.label, {
  				detail: _msg
  			});
  		}
  		return ev; //must return an event object
	}


	_handleSocketErrorEv(ev) {
		this.dispatchMessage(ev.type, ev);
		console.error(`PostOffice.Socket:::${this.name} errored`);
	}

	_handleSocketOpenEv(ev) {
		this.dispatchMessage(ev.type, ev);
		console.debug(`PostOffice.Socket:::${this.name} opened - `, ev);
	}

	_handleSocketCloseEv(ev) {
		this.dispatchMessage(ev.type, ev);
  		console.debug(`PostOffice.Socket:::${this.name} closed`);
  		if(this.autoRetryOnClose == true){
  			console.debug(`PostOffice.Socket:::${this.name} retrying connection in ${this.autoRetryInterval}s`);
  			setTimeout(()=>{
  				console.debug(`PostOffice.Socket:::${this.name} attempting to connect again`);
  				this.socket = new this.constructedFrom(this.url);
  				this.__init__();
  			}, this.autoRetryInterval*1000);
  			return;
  		}
	}

	_handleSocketMsgEv(socketMsgEv) {
		console.debug(`Socket:::${this.name} (incoming) received msg = `, socketMsgEv);
		var msgEv = this.onmessage(socketMsgEv);

		console.debug(`Socket:::${this.name} (processed msgEv) = `, msgEv);
		if(msgEv){
			this.dispatchEvent(msgEv);
		}
	}

	send(msg) {
		this.socket.send(msg);
	}


	sendMsg({lexemeName, msg}) {
        return new Promise((resolve, reject)=>{
        	console.debug(`DEBUG: ${this.name}:`, "sending message = ", lexemeName, msg);

        	var lexeme = this.LEXICON[lexemeName];

        	if(!lexeme){
        		let err = `Error: No such lexeme --> ${lexemeName}`;
	            reject({error: err});
	            return;
        	}

	        try {
	            var inflection = lexeme.inflect(msg);
	            if(!inflection){
	            	let err = `Error: Invalid msg form for ${lexemeName} --> ${inflection}`;
	                console.error(err);
	                reject({error: err})
	                return;
	            }
	        } catch (e) {
	            console.error("Error:", "error inflecting msg lexeme: ", e);
	            reject({error: e});
	            return;
	        }

	        console.debug(`DEBUG: ${this.name}: `, "Inflected Form = ", inflection.stringify());

	        let payloadJsonStr = inflection.stringify();
	        // payloadJsonStr = payloadJsonStr.replace(/\\n/g, '');
	        this.socket.send(payloadJsonStr);

	        console.debug(`DEBUG: ${this.name}:`, "message sent = ", payloadJsonStr);

	        resolve({error: null});
        }); 
    }

    addInterfaceSpec(interfaceSpec) {
    	// for(var k in lexiconMap) {
    	// 	lexiconMap[k]	
    	// }

    	this.INTERFACE_SPEC = interfaceSpec;



    	if(this.autoInitLexiconSubscriptions){
    		// console.debug("PostOffice ---- _initLexiconSubscriptions __start___ - ", this.INTERFACE_SPEC);
			this._initLexiconSubscriptions();
		}
    }

    publish(_label, _msg) {
    	console.debug(`DEBUG: PostOffice.Socket:::${this.name} Inflecting ${JSON.stringify(_msg)}`)

    	var lexeme = this.INTERFACE_SPEC[_label];

    	if(!lexeme){
    		let err = `Error: No such lexeme --> ${_label}`;
            throw Error(err);
            return;
    	}

        try {
            var inflection = lexeme.inflect(_msg);
            if(!inflection){
            	let err = `Error: Invalid msg form for ${_label} --> ${inflection}`;
                console.error(err);
                throw Error(err)
                return;
            }
        } catch (e) {
            console.error("Error:", "error inflecting msg lexeme: ", e);
            throw Error(e)
            return;
        }

        console.debug(`DEBUG: PostOffice.Socket:::${this.name} Publishing ${inflection.stringify()}`);

        let ev = this._msgToEv(_label, inflection.get());
		this.defaultScope.dispatchEvent(ev);
    }

	_msgToEv(_label,_msg, lexemeName) {
		let label = _label || "anonymous-event";
		if(lexemeName){
			let lexeme = this.LEXICON[lexemeName];
			if(!lexeme){
        		let err = `Error: invalid lexeme provided --> ${lexemeName}`;
	            throw Error(err);
        	}
        	var inflection;
        	try {
	            inflection = lexeme.inflect(_msg);
	            if(!inflection){
	            	let err = `Error: Invalid msg form for ${lexemeName} --> ${inflection}`;
	                console.error(err);
	                throw Error(err);
	            }
	        }catch (e) {
	            console.error("Error:", "error inflecting msg lexeme: ", e);
	            throw Error(e);
	        }

	        _msg = inflection.get();
		}
		return new CustomEvent(_label, {
			detail: _msg
		});
	}

	dispatchMessage(label, msg, lexemeName){
		let ev = this._msgToEv(label, msg, lexemeName);
		this.defaultScope.dispatchEvent(ev);
	}

	broadcastMsg (label, msg, _scope){
		if(!label){return;}
		var _scope = _scope || this.defaultScope;
		var evnt = new CustomEvent(label, {
		    detail: msg
		});
		_scope.dispatchEvent(evnt);
	}

	dispatchEvent (msgEv){ //for forward compat
		this.defaultScope.dispatchEvent(msgEv);
		console.log("imp:","PostOfficeSocket: ", this.name, " - dispatched message = ", msgEv);
	}

	addListener(label, cb) {
		return new Promise((resolve, reject)=>{
			var _cb = (ev)=> {

				try{
					var result = cb(ev.detail);
					resolve(result);
				}catch(e){
					reject(e);
				}
			}
			this.defaultScope.addEventListener(label,_cb);
			this.listeners.push({label:label,cb:cb});
		});
		// this.defaultScope.addEventListener(label,cb);
		// this.listeners.push({label:label,cb:cb});
	}
}

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
			console.log("PostOffice.Broker executing callback - ", idx);
			try{  //to prevent an error causing cb block execution of other cbs
				_cb(msg);
			}catch(e){
				console.log("PostOffice.Broker error executing callback - ", idx);
				return;
			}
			console.log("PostOffice.Broker successfully executed callback - ", idx);
		});
	}
}


PostOffice.Message = class PostOfficeMessage {

    static schema = {};

    constructor(msg) {
        this.msg = {...this.constructor.schema,...msg}
    }

    hasKey(key) {
        var _this = this;
        var keyList = key.split(".");
        if(keyList.length == 1){
            return key in this.msg;
        }

        var _msg = this.msg;
        var keyIdx = 0;

        var result = true;  //need to figure out a proper way for this initial value to be false (currently insecure)
        while (keyIdx < keyList.length) {
            var _keyToTest = keyList[keyIdx];
            if(_keyToTest in _msg) {
                _msg = _msg[_keyToTest];
                i+=1;
                continue;
            }
            result = false;
            break;
        }
        return result;
    }

    hasKeys() {
        var _this = this;
        var result = true;  //need to figure out a proper way for this initial value to be false (currently insecure)
        Array.from(arguments).forEach((key)=>{
            if(!_this.hasKey(key)){valid=false};
        });
        return result;
    }

    update(msg) {
        this.msg = {...this.msg,...msg}
        return this;
    }

    stringify() {
      return JSON.stringify(this.msg);
    }
}

PostOffice.defaultScope = PostOffice.addSocket(EventTarget,"global");
PostOffice.sockets.global.onmessage = (ev)=>{
	return ev;
}

export {
	PostOffice
}