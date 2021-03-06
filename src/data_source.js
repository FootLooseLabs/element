import { PostOffice } from "./post_office.js";
// var localforage = require(["/node_modules/localforage/dist/localforage.js"]);
// import localforage from "/node_modules/localforage/src/localforage.js";
import { DefaultConfig } from "./config.js";

import "localforage";


localforage.config({
	name: DefaultConfig.DB_NAME,
	version: DefaultConfig.DB_VERSION
});


class DataSource{   //returns null only if this.label is null

	static getOrCreate(label, socket, _cmp) {
		// if(proxyLabel){
		// 	return DataSource.getProxy(proxyLabel, replyLabel);
		// }
		// return new DataSource(label, socket, _cmp);
		if(!label){
			console.log("imp:","datasource initialisation stopped - No label specified.");
			return;
		}
		var _dataSrc = DataSource._getInstance(label, socket);
		if(_dataSrc){
			console.log("imp:","pre-existing datasource available - using the same.");
			return _dataSrc;
		}
		return new DataSource(label, socket, _cmp);
	}

	constructor(label, socket, _cmp, proxy) {
		// Object.defineProperty(this, 'data', {
		//    get: this._get
		// });
		this.socketName = socket;
	    this.socket = socket ? PostOffice.sockets[socket] : null;
	    this.label = label; //label has to be unique
	    this.events = [];
	    this.data = _cmp.schema || {};

	    // console.debug("DataSource constructor::::::: - ", this.data);

	    this._cmp = _cmp;
	    this.comms = {
	    	"init" : `${this.label}-datasrc-initialised`
	    }
	    this.eventTarget = new EventTarget();
	    this.active = true;
	    return this.__init__();
	}

	__init__() {
		if(!this.label){
			this._log("imp:","initialisation stopped - No label specified.");
			this.active = false;
			return;
		}

		this._initLogging();

		this._checkLocalDBorFixtures();
		this._initSocket();

		DataSource._instances.update(this);
 		
		this._log("imp:","initialisation successful;");
		// console.groupEnd();
	}

	_initLogging(){
		this._logPrefix = this._cmp._logPrefix + " DataSource: ";
		this._logStyle = "font-size: 12px; color:blue";
		// console.group(this._logPrefix);
	}

	_log() {
		var argumentsArr = Array.prototype.slice.call(arguments);
		if(arguments[0]==="imp:"){
			var msg = argumentsArr.slice(1,argumentsArr.length).join(" ");
			console.log("imp:", "%c" + this._logPrefix, this._logStyle, msg);
		}else{
			console.log("%c" + this._logPrefix, this._logStyle, msg);
		}
	}

	_initSocket(){
		if(!this.socket){
			this._log("No socket initialised");
		}
		var _this = this;
		if(this.socket){
			this.socket.addListener(this.label, (_msg) => {
				_this._onmsg.call(_this, _msg);
			});
		}
	}

	_normalizeData(data) {
		if (typeof this._cmp.schema == "object" && this._cmp.schema.hasOwnProperty("length")) {
			return data; // when data is an array
		}
		return {...this._cmp.schema, ...data};
	}

	_disptachMessage(data) {
		var ev = new CustomEvent( this.label,{
			detail: data
		})
		this.eventTarget.dispatchEvent(ev);
		PostOffice.broadcastMsg(this.label, data); //to currently allow for the registered borkers from other components 
	}

	_updateDataInContext(data) {
		this.data = data;
		this._log('imp:', 'updated data in context');
		this._disptachMessage(this.data);
	}

	_checkLocalDBorFixtures(){
		var _this = this;
		localforage.getItem(this.label).then((value) => {
			if(!value){
  				var fixtures = _this._loadFixtures();
		        if(!fixtures){
	            _this._log('imp:','no fixtures applied');
	        	}
	  			return;
	  		}
	  		_this._log('imp:', 'got locally stored data');
			_this._updateDataInContext(value);
        }).catch((err) => {
            _this._log('imp:', 'error checking locally stored data;', " _reason_: ", err, ";" );
            _this._loadFixtures(); 
        });
	}

	_loadFixtures(){
		this._log('imp:', "checking for fixtures");
  		if(!this._cmp) {return;}
    	var _cmp_data = this._cmp._getCmpData();
    	if(!_cmp_data){return;}

		if(_cmp_data.innerHTML == "") {return;}

		try{
			var data = JSON.parse(_cmp_data.innerHTML);
			this._updateData(data);
			this._log('imp:', "fixtures applied");
			return data;
		}catch(e){
			this._log("imp:", "invalid json in fixtures");
			return;
		}
		
	}

	// async _get () {
	// 	try {
	// 	    var _data = await localforage.getItem(this.label);
	// 	    // var _dataJSON = JSON.parse(_data);
	// 	    // console.log("imp:","GOT DATA in DataSource === ", _data);
	// 	    return _data;
	// 	} catch (err) {
	// 	    this._log("imp:","error in datasource._get --> ",err);
	// 	    return false;
	// 	}
	// 	// return JSON.parse(this.data).data;
	// }

	_updateData (_data) {
		this._log("attempting data update");
		var _this = this;
		if(this._cmp._isDebuggale()){
			TRASH_SCOPE.cmp_data_src = this;
		}
		var data = this._normalizeData(_data)
		localforage.setItem(this.label, data).then(function (value) {
            _this._log('imp:', 'updating data');
            _this._updateDataInContext(value);
        }).catch(function(err) {
            _this._log('imp:','error updating data;', ' _reason_: ', err);
        });
	}

	_authenticateMsg (_msg) {
		// var auth = false;
		// if(_msg.label === this.label){ auth = true;}
		return _msg.label === this.label;
	}

	// _onmsg (_msg) {
	// 	if(!this._authenticateMsg(_msg)){return;}

	// 	console.group(this._logPrefix);
	// 	this._log("imp:", "got msg - ");
	// 	if(!_msg.data){return;}
	// 	var _data = null;
	// 	try{
	// 		_data = JSON.parse(_msg.data).data;
	// 		// JSON.stringify(_data);  // no performance benefit to converting to strings & storing (instead additional steps)
	// 	}
	// 	catch(err){
	// 		this._log("imp:", "socket data received is not valid json;", ' _reason_: ', err);
	// 	}
	// 	if(!_data){return;}

	// 	console.dir(_data);

	// 	this._updateData(_data);
	// 	console.groupEnd()
	// }

	_onmsg (_msg) {
		// var _msgStr = msgEv.data;
  		// try{
  		// 	var _msg = JSON.parse(_msgStr);
  		// }catch(e){ //not valid msg
  		// 	return;
  		// }
  		this._log("imp:", "DataSrc received msg - ", _msg);

  		if(!this._authenticateMsg(_msg)){
  			this._log("imp:","msg authentication failed for - ", _msg);
  			return;
  		}

  		// console.group(this._logPrefix);
  		
  		this._log("imp:", "DataSrc validated msg - ", JSON.stringify(_msg));

  		if(_msg.data || _msg.result){
  			let _dataToStore = _msg.data || _msg.result;

  			console.debug(`DataSource: ${this.label} stroring the following data - `);
  			console.dir(_dataToStore);
  			this._updateData(_dataToStore);
  		}
  		
  		// console.groupEnd();
  	}
}

DataSource._instances = [];

DataSource._instances.update = function(_entry){
	DataSource._instances.push(_entry);
}

DataSource._getInstance = function(label, socket){
	return DataSource._instances.find((_ds)=>{
		return _ds.label == label && _ds.socketName == socket;
	});
}

// DataSource.getProxy = function(proxyLabel, replyLabel){
// 	console.log("imp:","searching for proxy data source");
// 	window.ttutis = this;
// 	var proxy = DataSource._getInstance(proxyLabel);  //could have used label attribute (if found with given label - use the same --> BUT this would have disabled those scenarios where 2 or more different data-sources might be changing the same data)
// 	if(!proxy){
// 		console.log("imp:","could not find any proxy data source with label = " + proxyLabel);

// 		var msgLabel = `${proxyLabel}-datasrc-initialised`;
// 		PostOffice.registerBroker(this, msgLabel, (ev)=>{
// 			console.log("imp:", "in on the");
// 			PostOffice.broadcastMsg(replyLabel);
// 		});

// 		this.active = false;
// 		return;
// 	}
// 	var datasrc = new Proxy(proxy, {}); //using proxy to enable proxy datasources to extend/abstract certain functions/data from the datasources they are proxying from without affecting them.
// 	console.log("imp:","created proxy data source " + this.proxy);
// 	return datasrc;
// }

export {
	DataSource
}