class PostOffice extends Object {

	// constructor() {
	// 	this.registry = [];
	// }
	static defaultScope = new EventTarget();

	static addSocket(_constructor, name, _url) {
		PostOffice.sockets[name] = new PostOffice.Socket(_constructor, name, _url);
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
}

PostOffice.sockets = {};
PostOffice.registry = [];

PostOffice.Socket = class PostOfficeSocket {
	constructor(_constructor, name, url) {
	  var _constructor = _constructor || WebSocket;
	  this.name = name;
	  this.url = url;
	  this.socket = new _constructor(url);
	  this.defaultScope = new EventTarget();
	  this.listeners = [];
	  this.__init__();
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
	  		_this._onMsg.call(_this, msgEv)
	  	});
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
		console.log("imp:", socketMsgEv);
		var _msgStr = socketMsgEv.data;
		if(_msgStr=="response:"){return;} //ping-pong messages exchanged in keepAlive
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
  		return ev;
	}

	_onMsg(socketMsgEv) {
		var msgEv = this.onmessage(socketMsgEv);
		if(msgEv){
			this.dispatchMessage(msgEv);
		}
	}

	send(msg) {
		this.socket.send(msg);
	}

	dispatchMessage(msgEv) {
		this.defaultScope.dispatchEvent(msgEv);
		console.log("imp:","PostOfficeSocket: ", this.name, " - dispatched message = ", msgEv);
	}

	addListener(label, cb) {
		this.defaultScope.addEventListener(label,cb);
		this.listeners.push({label:label,cb:cb});
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


export {
	PostOffice
}