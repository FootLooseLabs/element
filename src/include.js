import { randomString, stringToDocFrag, send_ajax } from "./utils.js";


// import { DOMComponent } from "./dom_component.js";
// import { DOMComponentRegistry } from "./dom_component_registry.js";

// class IncludeFrag extends DOMComponent {

// 	constructor(){
// 		super();
// 		this.data = "<div></div>";
// 	}

// 	static domElName () { return "include-frag";}

// 	static markupFunc(_data, uid){
// 		return `${_data}`;
// 	}

// 	getSrc() {
// 		return this.getAttribute("src");
// 	}

// 	onConnect() {
// 		var _src = this.getSrc();
// 		if(!_src) {return;}
// 		this.loadFragment(IncludeFrag.fullFragURL(_src));
// 	}

// 	loadFragment(frag_url){
// 		var _this = this;
// 		window.titt = this;
// 		console.log("imp:","LOADING PAGE - ", frag_url);
// 		var _pr = new Promise((_resolve, _reject)=>{
// 			send_ajax(frag_url,'GET', function(res){
// 				try{
// 					// _this.dataset.update = randomString();
// 					return _resolve(res);
// 				}catch(e){
// 					return _reject(e);
// 				}
// 			}, null, function(e){
// 				console.log("error loading included html - ", e);
// 			});
// 		});
// 		_pr.then((val)=>{
// 			_this.data = val;
// 			// console.log("imp:","PROMISE SUCCESSFUL", val);
// 			_this.render();
// 		})
// 		// return _pr;
// 	}


// 	static fullFragURL(_url){
// 		if(IncludeFrag._checkIfTerminatingCmpUrl(_url)){
// 			return _url;
// 		}
// 		return _url + '/component.html';
// 	}

// 	static _checkIfTerminatingCmpUrl (_url){
// 		return _url.slice(-5) == ".html" || _url.slice(-4) == ".svg";
// 	}
// }


// DOMComponentRegistry.register(IncludeFrag);

// // document.addEventListener('frag-loaded', function(e){
// // 	console.log("frag loaded - ", e.detail);
// // 	searchAndLoadComponentByFragIds(e.detail._child_ids);
// // });


// export {
// 	IncludeFrag
// }


(function(){
	function docFragParser(_docFrag, cmp_el){
		var t = _docFrag.querySelector('template');
		var doc = document.importNode(t.content,true);
		// var doc = link.import;
		// dd = doc;
		var docFrag = document.createDocumentFragment();
		var scriptFrag = document.createDocumentFragment();

		var _frag_id = randomString(7);
		// window.cmp_el = cmp_el;
		var cmp_el_src = cmp_el.getAttribute('src');

		if(_checkIfTerminatingCmpUrl(cmp_el_src)){
			cmp_el_src = cmp_el_src.split('/');
			cmp_el_src.pop();
			cmp_el_src = cmp_el_src.join('/');
		}


		while(doc.firstChild){
			var content = doc.firstChild;

			if(content.src){
				content.src = content.src[0] == "/" ? content.src : content.src = cmp_el_src + content.src.split(window.location.origin).pop();
			}
			if(content.href){
				content.href = content.href[0] == "/" ? content.href : content.href =  cmp_el_src + content.href.split(window.location.origin).pop();
			}

			if(content.tagName=="SCRIPT"){
				// console.log("FOUND SCRIPT = ", content);
				scriptFrag.insertBefore(content, scriptFrag.firstChild); //so that order of scripts is same as in template
			}else{
				docFrag.appendChild(content);
			}
		}
		return {_html: docFrag, _script: scriptFrag, _id: _frag_id}
	}


	document.addEventListener('frag-loaded', function(e){
		console.log("frag loaded - ", e.detail);
		searchAndLoadComponentByFragIds(e.detail._child_ids);
	});

	function stampFragFirstChildGeneration(docFrag){
		var _ids = [];
		[].slice.call(docFrag.children).forEach(function(_el){
			if(_el.querySelector('include')){
				console.log("stamping - ", _el);
				console.log("because - ", _el.querySelector('include'));
				var _child_id = randomString(5);
				_el.setAttribute("include-id", _child_id); 
				_ids.push(_child_id);
			}
		});
		return _ids;
	}

	function searchAndLoadComponentByFragIds(cmp_child_ids){
		cmp_child_ids.forEach(function(_child_id){
			var _cmp = document.querySelector("[include-id='"+_child_id+"']");
			initComponentsInFrag(_cmp);
		})
		
	}

	function loadDocFragIntoDom(docFrag, target_el){
		console.log("loading include doc frag - ", docFrag);
		// ee = e;

		var _parent_elem = target_el.parentElement;

		var _parsed_frag = docFragParser(docFrag, target_el);

		var _child_ids = stampFragFirstChildGeneration(_parsed_frag._html);

		

		_parent_elem.replaceChild(_parsed_frag._html,target_el);

		// if(_parent_elem.firstElementChild.__vue__){
		// 	_parent_elem.firstElementChild.__vue__.$destroy();
		// }

		// ff = _parsed_frag
		document.body.appendChild(_parsed_frag._script);

		searchAndLoadComponentByFragIds(_child_ids);

		// triggerCustomEvent(document, "frag-loaded", {"_child_ids":_child_ids});
	}

	function stringToHtml(html_string) {
	     var dom = null;
	     if (window.DOMParser) {
	        try { 
	           dom = (new DOMParser()).parseFromString(html_string, "text/html"); 
	        } 
	        catch (e) { dom = null; }
	     }
	     else if (window.ActiveXObject) {
	        try {
	           dom = new ActiveXObject('Microsoft.XMLDOM');
	           dom.async = false;
	           if (!dom.loadXML(html_string)) // parse error ..

	              window.alert(dom.parseError.reason);
	        } 
	        catch (e) { dom = null; }
	     }
	     else
	        alert("cannot parse xml string!");
	     return dom;
	  }

	function loadComponent(el, component_url, is_child_comp){
		// console.log("loadComponent - ", el, component_url);
		// var l = document.createElement('link');
		// l.setAttribute('rel','import');


		// el.parentElement.replaceChild(l, el);
		
		// l.onload = function(e){
		// 	console.log("CMP LINK LOADED - ", this);
		// 	loadLinkDocIntoDom(e);
		// }

		// l.setAttribute('href', component_url);

		send_ajax(component_url,'GET', function(r){
			loadDocFragIntoDom(stringToHtml(r), el);
		}, null, function(e){
			console.log("error loading included html - ", e);
		})
		
		// console.log("appended link - ",l , " to el.parent - ", el.parentElement);
		// console.log("l onload = " ,l.onload);
		
		// if(is_child_comp) { setTimeout( function(){ 
		// 	window.link_in_dom = document.querySelector("link[href='" + component_url + "']");
		// 	triggerCustomEvent(link_in_dom, "load");
		// }, 1000 )}
	}

	function findComponentDefinition(el){
		var c = null;
	  	window.components[el.getAttribute('name')] ? c = components[el.getAttribute('name')] : null;
	  	return c;
	}


	function _checkIfTerminatingCmpUrl (_url){
		return _url.slice(-5) == ".html" || _url.slice(-4) == ".svg";
	}

	function fullComponentUrl(_url){
		if(_checkIfTerminatingCmpUrl(_url)){
			return _url;
		}
		return _url + '/component.html';
	}

	function initComponentsInFrag(frag){
		var frag = frag || document;
		var cmp = frag.querySelectorAll('include');
		if(cmp.length < 1){return;}
		cmp.forEach(function(el,i){
			// console.log(el.getAttribute('name'));
			var _src = el.getAttribute('src');
			if(_src){
				console.log('initializing include - ', el, ' inside - ', frag);
				var is_child_comp = frag != document ? true : false;
				loadComponent(el, fullComponentUrl(_src), is_child_comp);
			}
			// else{
			// 	var cmp_def = findComponentDefinition(el);
			// 	if(cmp_def){
	 		//		loadComponent(el,fullComponentUrl(cmp_def.src));
	 		//	}
	 		// }
		})
	}



	if(document.readyState != "complete"){
		document.addEventListener('DOMContentLoaded', function(){
			initComponentsInFrag(document);
		},false);
	}else{
		initComponentsInFrag(document);
	}
})();