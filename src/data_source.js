import { PostOffice } from "./post_office.js";
var localforage = require(["/node_modules/localforage/dist/localforage.js"]);
// import * as localForage from "localforage";

class DataSource{

	constructor(label, socket, _cmp) {
		// Object.defineProperty(this, 'data', {
	 //        get: this._get
	 //    });
	    this.socket = socket ? PostOffice.sockets[socket] : null;
	    this.label = label;
	    this.events = [];
	    this.data = {};
	    this._cmp = _cmp;
	    this.__init__();
	}

	__init__() {
		if(!this.socket){
			console.log("no datasource initialised for - ", this.label);
		}
		var _this = this;

		localforage.getItem(this.label).then((value) => {
			if(!value){
				_this._loadFixtures();
				return;
			}
			_this.data = value;
            console.log('imp:', 'got locally stored data for: ', _this.label);
        }).catch((err) => {
            console.log('imp:', 'Could not get data for:', _this.label, ",coz of the error === ", err);
            _this._loadFixtures(); 
        });


        if(this.socket){
			this.socket.addEventListener("message", (ev) => {
				_this._onmsg.call(_this, ev);
			});
		}
		console.log("DataSource initialised for - ", this.label);
	}

	async _get () {
		try {
		    var _data = await localforage.getItem(this.label);
		    // var _dataJSON = JSON.parse(_data);
		    // console.log("imp:","GOT DATA in DataSource === ", _data);
		    return _data;
		} catch (err) {
		    console.log("imp:","error in datasource._get --> ",err);
		}
		// return JSON.parse(this.data).data;
	}

	_loadFixtures () {
		if(!this._cmp) {return;}
    	var _cmp_data = this._cmp._getCmpData();
    	if(!_cmp_data){return;}
        console.log('imp:', this.label, " --> checking for fixtures");
        if(this._cmp._isDebuggale()){
        	TRASH_SCOPE.cmd_data = _cmp_data.innerHTML;
        }
        try{
			var data = JSON.parse(_cmp_data.innerHTML);
			this._updateData(data);
			console.log('imp:', this.label, " --> fixtures applied in ", this._cmp);
		}catch(e){
			console.log("imp:", this.label, " --> invalid json in component-data fixtures");
		}
		
	}

	_updateData (data) {
		var _this = this;
		if(this._cmp._isDebuggale()){
			TRASH_SCOPE.cmp_data_src = this;
		}
		localforage.setItem(this.label, data).then(function (value) {
			_this.data = value;
            console.log('imp:',_this.label,'- ','updated data in DataSource');
            PostOffice.broadcastMsg(_this.label, _this.data);
        }).catch(function(err) {
            console.log('imp:',_this.label,'- ','Could not save data to DataSource:', err);
        });
	}

	_onmsg (ev) {
		console.log("imp:","datasource got msg - ", ev);
		if(!ev.data){return;}
		var _data = null;
		try{
			_data = JSON.parse(ev.data).data;
			// JSON.stringify(_data);  // no performance benefit to converting to strings & storing (instead additional steps)
		}
		catch(e){
			console.log("imp:", "socket data received at - ", this.socket, "with label - ", this.label, ", is not valid json");
		}
		if(!_data){return;}
		this._updateData(_data);
	}
}


export {
	DataSource
}