import { PostOffice } from "./post_office.js";
// var localforage = require(["/node_modules/localforage/dist/localforage.js"]);
// import localforage from "/node_modules/localforage/src/localforage.js";
import "localforage";

class DataSource{

	constructor(label, socket, _cmp) {
		// Object.defineProperty(this, 'data', {
		//    get: this._get
		// });
	    this.socket = socket ? PostOffice.sockets[socket] : null;
	    this.label = label;
	    this.events = [];
	    this.data = {};
	    this._cmp = _cmp;
	    this.__init__();
	}

	__init__() {
		this._initLogging();

		if(!this.socket){
			this._log("initialisation skipped; _reason_: no socket attribute defined;");
		}

		this._checkLocalDBorFixtures();
		this._initSocket();
 
		this._log("initialisation successful;");
	}


	_initLogging(){
		this._logPrefix = "%c" + this._cmp.domElName + ".DataSource: ";
		this._logStyle = "font-size: 12px; color:blue";
	}

	_log() {
		var argumentsArr = Array.prototype.slice.call(arguments);
		if(arguments[0]==="imp:"){
			var msg = argumentsArr.slice(1,argumentsArr.length).join(" ");
			console.log("imp:", this._logPrefix, this._logStyle, msg);
		}else{
			console.log(this._logPrefix, this._logStyle, msg);
		}
	}

	_initSocket(){
		var _this = this;
		if(this.socket){
			this.socket.addEventListener("message", (ev) => {
				_this._onmsg.call(_this, ev);
			});
		}
	}

	_checkLocalDBorFixtures(){
		var _this = this;
		localforage.getItem(this.label).then((value) => {
			if(!value){
				_this._loadFixtures();
				return;
			}
			_this.data = value;
            _this._log('imp:', 'got locally stored data');
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

        if(this._cmp._isDebuggale()){
        	TRASH_SCOPE.cmd_data = _cmp_data.innerHTML;
        }

        try{
			var data = JSON.parse(_cmp_data.innerHTML);
			this._updateData(data);
			this._log('imp:', "fixtures applied");
		}catch(e){
			this._log("imp:", "invalid json in fixtures");
		}
		
	}

	async _get () {
		try {
		    var _data = await localforage.getItem(this.label);
		    // var _dataJSON = JSON.parse(_data);
		    // console.log("imp:","GOT DATA in DataSource === ", _data);
		    return _data;
		} catch (err) {
		    this._log("imp:","error in datasource._get --> ",err);
		    return false;
		}
		// return JSON.parse(this.data).data;
	}

	_updateData (data) {
		console.log("attempting data update");
		var _this = this;
		if(this._cmp._isDebuggale()){
			TRASH_SCOPE.cmp_data_src = this;
		}
		localforage.setItem(this.label, data).then(function (value) {
			_this.data = value;
            _this._log('imp:', 'updated data');
            PostOffice.broadcastMsg(_this.label, _this.data);
        }).catch(function(err) {
            _this._log('imp:','error updating data;', ' _reason_: ', err);
        });
	}

	_onmsg (ev) {
		console.group("datasource#"+this._cmp.uid + " ("+this._cmp.domElName+")");
		this._log("imp:", "got msg - ");
		if(!ev.data){return;}
		var _data = null;
		try{
			_data = JSON.parse(ev.data).data;
			// JSON.stringify(_data);  // no performance benefit to converting to strings & storing (instead additional steps)
		}
		catch(err){
			this._log("imp:", "socket data received is not valid json;", ' _reason_: ', err);
		}
		if(!_data){return;}

		console.dir(_data);

		this._updateData(_data);
		console.groupEnd()
	}
}

export {
	DataSource
}