import { randomString } from "./utils.js";
import { DOMComponentRegistry } from "./dom_component_registry.js";
import { PostOffice } from "./post_office.js";
import { DataSource } from "./data_source.js";
import { stringToHTMLFrag } from "./utils.js";

class DOMComponent extends HTMLElement {

	static get observedAttributes() { return ['data-update']; }

	defaultLifecycleInterfaces (state){
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
		this.interfaces = {};
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

		this.styleMarkup = this.constructor.styleMarkup || opt.styleMarkup;

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
			this.__initDataSrcInterface(label);
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

	__initDataSrcInterface(label) {
		var _this = this;


		this.broker = PostOffice.registerBroker(this, label, (ev)=>{
			_this._onDataSrcUpdate.call(_this, ev)
		});
	}

	_initDefaultInterfaces(opt) {
		// var _this = this;
		// this.defaultLifecycleInterfaces().map((_entry)=>{
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

		this._initDefaultInterfaces(opt);

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

	__processStyleMarkup() {
		if(!this.styleMarkup){return;}
		if(this._renderedStyle){return;}

	    try{
	    	var _renderedStyleString = this.styleMarkup(`[data-component=${this.uid}]`);  //called only once
	    	this._renderedStyle = stringToHTMLFrag(_renderedStyleString);
	    }catch(e){
	      console.log("imp:", "error in rendering style - ", e);
	      return;
	    }

	    this._renderedFrag.prepend(this._renderedStyle);
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

  _getChildCmps() {
    var cmp_dom_node = this._getDomNode();
    if(!cmp_dom_node){ return []; }
    return Array.from(cmp_dom_node.querySelectorAll('[data-component]')); 
  }

  _processChildCmps() {
    var _this = this;
    var childCmpsInDOM = _this._getChildCmps();
    if(childCmpsInDOM.length==0){return;}

    console.log("imp:", "PROCESSING CHILD CMPS");
    var cmpSelector = DOMComponentRegistry.list().map((_entry)=>{return _entry.name}).join(",");
    var childCmpsInRenderedFrag = _this._renderedFrag.querySelectorAll(cmpSelector);


    childCmpsInRenderedFrag.forEach((_childCmpInFrag, fragCmpIdx)=>{
      var _childCmpInDom = childCmpsInDOM.find((_cmp, domCmpIdx)=>{
        return _cmp.constructedFrom.domElName == _childCmpInFrag.tagName.toLowerCase()
      });
      if(_childCmpInDom){
        _childCmpInFrag.replaceWith(_childCmpInDom);
        // _childCmpInDom.render();
      }
      // childCmpsInDOM.splice(domCmpIdx, 1);
      // childCmpsInDOM.shift();
    });

    // childCmpsInDOM.forEach((_childCmp, idx)=>{ //would not work if 2 child elements of the same type
    //   try{
    //     _this._renderedFrag.querySelector(_childCmp.dataset.cmpname).replaceWith(_childCmp);
    //   }catch(e){}
    // })
  }

  render() { //called from either - 1.) datasrcupdate, 2.) datasrc is null after init, 3.) onattributechange
    this._log("----------rendering component start---------------");
    var _this = this;
    var cmp_dom_node = this._getDomNode();

    try{
      var _rendered = this.markupFunc(this.data, this.uid, this.uiVars, this.constructor); 
    }catch(e){
      console.log("imp:", "error in rendering component - ", e);
      return;
    }
    // this.shadow.innerHTML = _rendered;

    // this._log("imp:","rendered markupFunc");
    this._renderedFrag = stringToHTMLFrag(_rendered);
    // this._log("imp:","rendered fragment");

    if(this.attributes.stop){
      TRASH_SCOPE.stoppedCmp = this;
      return;
    }

    // this._processChildCmps();

    this._renderedFrag.firstElementChild.dataset.component = this.uid;
    Reflect.defineProperty(this._renderedFrag.firstElementChild, "constructedFrom", {value: this});


    this.__processStyleMarkup();
    this.__processRenderedFragEventListeners();
    // this._log("imp:","renderered fragment uid");
    
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