import { randomString } from "./utils.js";
import { DOMComponentRegistry } from "./dom_component_registry.js";
import { PostOffice } from "./post_office.js";
import { DataSource } from "./data_source.js";
import { stringToHTMLFrag } from "./utils.js";

class DOMComponent extends HTMLElement {

	static get observedAttributes() { return ['data-update']; }

	defaultLifecycleBrokers (state){
		var defaultBrokers = [
					{state: "datasrcInit", label :"init-data-src-" + this.uid}
			   ]

		if(state){
			return defaultBrokers.filter((_broker)=>{
				return _broker.state == state;
			});
		}
		return defaultBrokers;
	}

	constructor(opt){
		super();
		if(this._isDebuggale()){
			TRASH_SCOPE._debugCmp = this;
		}
		var opt = opt || {};
		this.data = this.constructor.schema || {};
		this.schema = this.constructor.schema || {};
		this.domElName = this.constructor.domElName || opt.domElName;
		this.uid = randomString(8);
		this.uiVars = {};
		this.data_src = null;
		this.opt = opt;
	}


	connectedCallback() {
		var opt = this.opt;
		this.__init__(opt);
		if(this.onConnect) {
			this.onConnect.call(this);
		}
	}

	_onDataSrcUpdate(ev) {
		this._log("imp:",this.data_src.label,"- ","component data update signal received");
		this.render();
	}

	attributeChangedCallback () {
		this.render();
	}

	__init__(opt) {
		var _this = this;
		this._initLogging();

		this._log("imp:","DOMELName = ", this.domElName);
		this._log("imp:","component data/schema = ");
		console.dir(this.data);
		this._log("initialising with ", opt);

		this.shadow = this.attachShadow({mode: opt.domMode || "open"});
		this.markupFunc = this.constructor.markupFunc || opt.markupFunc;
		this.processData = this.constructor.processData || opt.processData;
	
		if(!this.markupFunc){
			this._log("----------initialisation stopped - no markupFunc found---------------");
			return;
		}

		this._initLifecycle(opt);

		this._log("imp:", "initialised");

		console.groupEnd();
	}

	_initLogging() {
		this._logPrefix =  this.domElName + " #" + this.uid + ":";
		this._logStyle = "font-size: 12px; color:darkred";
		console.group(this._logPrefix);		
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

	_isDebuggale() {
		return this.hasAttribute("debug");
	}

	_getCmpData(){
		return this.querySelector("component-data");
	}

	_getDomNode(){
		return document.querySelector("[data-component='" + this.uid + "']");
	}

	_initComponentDataSrc(opt){
		var _cmp_data = this._getCmpData();
		if(_cmp_data){
			var label = _cmp_data.getAttribute("label");
			var socket = _cmp_data.getAttribute("socket");
			this._log("imp:","initialising component data source");
			this.__initDataSrcBroker(label);
			// this.data_src = new DataSource(label, socket, this, proxy);
			this.data_src = DataSource.getOrCreate(label, socket, this);
		}
		if(this.data_src){
		 	Object.defineProperty(this, 'data', {
		        get: ()=>{return this.postProcessCmpData.call(this, this.data_src.data);}
		    });
		}else{  //happens when _cmd_data is null or label is null
			this._log("imp:","component data is null, directly rendering the component.");
			this.render();
		}
	}

	__initDataSrcBroker(label) {
		var _this = this;
		this.broker = PostOffice.registerBroker(this, label, (ev)=>{
			_this._onDataSrcUpdate.call(_this, ev)
		});
	}

	_initDefaultBrokers(opt) {
		// var _this = this;
		// this.defaultLifecycleBrokers().map((_entry)=>{
		// 	PostOffice.registerBroker(_this, _entry.label, (ev)=>{
		// 		_this._initComponentDataSrc.call(_this);
		// 	});
		// });
	}

	_initUiVars(opt) {
		// Object.defineProperty(this, 'uiVars', {
	 //        set: (value)=>{
	 //        	this['uiVars']=value;
	 //        	this.render();
	 //        }
	 //    });
	} 

	_initLifecycle(opt) {
		this._initUiVars(opt);

		this._initDefaultBrokers(opt);

		this._initComponentDataSrc(opt);

	}

	postProcessCmpData(newData) {
		// console.group(this._logPrefix+"postProcessData");
		this._log("imp:","Post-Processing cmp data (label = " + this.data_src.label + "), data = ");
		console.dir(newData);
		if(this.processData){   //processData can be defined when creating components (see inventory_block.js - MedicineThumbnailList)
			try{
				this._processedData = this.processData.call(this, newData);
				return this._processedData;
			}catch(e){
				this._log("imp:","could not post process CMP data - ", e);
				return newData;
			}
		}
		return newData;
		// console.groupEnd();
	}

	__processRenderedFragEventListeners () {
		var _this = this;
		this._events = {
			"onchange": [],
			"onclick": [],
			"oninput": []
		};
		this._renderedFrag.querySelectorAll("[on-change]").forEach((_el)=>{
			_el.onchange = function() {
				// _el.attributes["on-change"].value.call(_this);
				_this[_el.attributes["on-change"].value].call(_this, _el);
			}
			this._events.onchange.push(_el.attributes["on-change"]);
		});
		this._renderedFrag.querySelectorAll("[on-input]").forEach((_el)=>{
			_el.oninput = function() {
				_this[_el.attributes["on-input"].value].call(_this, _el);
			}
			this._events.onchange.push(_el.attributes["on-input"]);
		});
		this._renderedFrag.querySelectorAll("[on-click]").forEach((_el)=>{
			_el.onclick = function() {
				_this[_el.attributes["on-click"].value].call(_this, _el);
			}
			this._events.onchange.push(_el.attributes["on-click"]);
		});
	}

	render() { //called from either - 1.) datasrcupdate, 2.) datasrc is null after init, 3.) onattributechange
		this._log("----------rendering component start---------------");
		var _this = this;

		try{
			var _rendered = this.markupFunc.call(this.prototype, this.data, this.uid, this.uiVars); //this.prototype returns the class instance invoking this method 
		}catch(e){
			console.log("imp:", "following error in render markupFunc - ", e);
			return;
		}
		// this.shadow.innerHTML = _rendered;

		// this._log("imp:","rendered markupFunc");
		this._renderedFrag = stringToHTMLFrag(_rendered);
		// this._log("imp:","rendered fragment");
		this._renderedFrag.firstElementChild.dataset.component = this.uid;

		this.__processRenderedFragEventListeners();
		// this._log("imp:","renderered fragment uid");
		var cmp_dom_node = this._getDomNode();
		try{
			if(cmp_dom_node){
				// cmp_dom_node.outerHTML = _rendered;
				cmp_dom_node.replaceWith(this._renderedFrag); //case when a rendered custom element re-rendering (after some data update)
			}else{
				// this.outerHTML = _rendered; //case when custom element in the html is rendered for the 1st time
				this.replaceWith(this._renderedFrag);
			}
			// this._log("imp:","cmpdomnode = ", cmp_dom_node);
			
		}catch(e){
			this._log("imp:","(ERROR) - component rendering failed with the following error - \n", e);
		}

		TRASH_SCOPE.debugLastRenderedCmp = this;
		this._log("----------rendering component end-----------------");
		
		return this
	}
	
}

DOMComponent.prototype._binding = function(b) {
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