import { randomString } from "./utils.js";
import { DOMComponentRegistry } from "./dom_component_registry.js";
import { PostOffice } from "./post_office.js";
import { DataSource } from "./data_source.js";

class DOMComponent extends HTMLElement {

	static defaultLifecycleBrokers (){
		return [
					{
						label: "dataChange", 
						callback: () => {
							this.render
						}
					}
				]
	}

	constructor(opt){
		super();
		console.log("arguments - ", arguments);
		console.log("this - ", this);
		if(this._isDebuggale()){
			TRASH_SCOPE._debugCmp = this;
		}
		var opt = opt || {};
		this.data = this.constructor.schema || {};
		this.domElName = this.constructor.domElName || opt.domElName;
		this.uid = randomString(8);

		this.data_src = null;

		this.__init__(opt);
	}

	__init__(opt) {
		console.log("consoling ---> ", opt);	
		var _this = this;
		this._initComponentDataSrc(opt);
		this.shadow = this.attachShadow({mode: opt.domMode || "open"});
		this.markupFunc = this.constructor.markupFunc || opt.markupFunc;
		this.processData = this.constructor.processData || opt.processData;
		if(document.readyState == "complete"){
			DOMComponentRegistry.add(this);
		}else{
			document.addEventListener("DOMContentLoaded", ()=>{DOMComponentRegistry.add(_this);});
		}
		if(!this.markupFunc){
			console.log("----------no markupFunc found---------------");
			return;
		}
		this.render();
		this._init_lifecycle(opt);
	}

	_isDebuggale() {
		return this.hasAttribute("debug");
	}

	_getCmpData(){
		return this.querySelector("component-data");
	}

	_initComponentDataSrc(opt){
		var _cmp_data = this._getCmpData();
		if(_cmp_data){
			var label = _cmp_data.getAttribute("label");
			var socket = _cmp_data.getAttribute("socket");
			if(label && socket){
				this.__initDataSrcBroker(label);
				this.data_src = new DataSource(label, socket, this);
				 // Object.defineProperty(this, 'data', {
				 //        get: ()=>{return this.data_src._get()},
				 //        // set: (val) => {this.data_src._updateData(val)}
				 //        set: (val) => {this.data = val}
				 //    });	
			}
		}
	}

	_getDomNode(){
		return document.querySelector("[data-component='" + this.uid + "']");
	}

	__initDataSrcBroker(label,cb,scope) {
		var _this = this;
		this.broker = PostOffice.registerBroker(_this, label, (ev)=> {
			console.log("imp:",_this.label,"- ","component data update signal received");
			try{
				var _newData = _this.data_src._get();
				_newData.then((_val)=>{
					_this.processCmpData(_val);
					_this.render();
				})
					// _data_promise.then((data)=>{
					// 	var dataJson = JSON.parse(data).data;
					// 	TRASH_SCOPE.dataJson = dataJson;
					// 	_this.processCmpData(dataJson); //needs to be generalised (remove 'trays' key post that)
					// 	_this.render();
				// });
			}catch(e){
				console.log("imp:","(ERROR) - ", e);
			}
		})
	}

	_init_default_brokers(opt) {
		// DOMComponent.defaultLifecycleBrokers.forEach((_le)=>{
		// 	PostOffice.registerBroker(_le.label, update)
		// 	document.addEventListener(_le.label, _le.callback);
		// });
	}

	_init_lifecycle(opt) {
		this._init_default_brokers(opt)
	}

	processCmpData(newData) {
		console.log("imp:","THEN - ", this.data_src.label, " === ", newData);
		try{
			if(this.processData){   //processData can be defined when creating components (see inventory_block.js - MedicineThumbnailList)
				var newData = this.processData.call(this, newData);
			}
			this.data = newData;
			return true;
		}catch(e){
			console.log("imp:","could not update CMP data");
			return false;
		}
	}

	render() {
		console.log("----------rendering component start---------------");
		TRASH_SCOPE.____data = this.data;
		var _rendered = this.markupFunc.call(this, this.data, this.uid);
				// this.shadow.innerHTML = _rendered;
		var cmp_dom_node = this._getDomNode();
		try{
			if(cmp_dom_node){
				cmp_dom_node.outerHTML = _rendered;
			}else{
				this.outerHTML = _rendered; //case when custom element in the html is rendered for the 1st time
			}
		}catch(e){
			console.log("(ERROR) - component rendering failed with the following error - \n", e);
		}
		TRASH_SCOPE.debugRenderedCmp = this;
		console.log("----------rendering component end-----------------");
		return this
	}
	
}

DOMComponent.prototype._binding = function(b) { //rollup gives build error in var _this = this --> if this is an arrow function
    var _this = this;
    this.element = b.element;    
    this.value = b.object[b.property];
    this.attribute = b.attribute;
    this.valueGetter = function(){
        return _this.value;
    }
    this.valueSetter = function(val){
        _this.value = val;
        _this.element[_this.attribute] = val;
    }

    Object.defineProperty(b.object, b.property, {
        get: this.valueGetter,
        set: this.valueSetter
    }); 
    b.object[b.property] = this.value;

    this.element[this.attribute] = this.value;
}


export {
	DOMComponent,
	PostOffice,
	DataSource,
	DOMComponentRegistry
}