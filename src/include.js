"use strict;"

import { randomString, stringToDocFrag, send_ajax } from "./utils.js";

class IncludeFrag extends DOMComponent {

	static domElName () { return "include-frag";}

	static async markupFunc(){
		var _src = this.getSrc();
		if(!_src) {return;}
		return await this.loadFragment(el, fullFragURL(_src));
	}

	getSrc() {
		return this.getAttribute("src");
	}

	loadFragment(el, component_url){
		var _pr = new Promise((_resolve, _reject)=>{
			send_ajax(component_url,'GET', function(res){
				try{
					var resFrag = stringToDocFrag(res);
					return _resolve(resFrag);
				}catch(e){
					return _reject(e);
				}
			}, null, function(e){
				console.log("error loading included html - ", e);
			});
		});
		return _pr;
	}


	static fullFragURL(_url){
		if(_checkIfTerminatingCmpUrl(_url)){
			return _url;
		}
		return _url + '/component.html';
	}

	static _checkIfTerminatingCmpUrl (_url){
		return _url.slice(-5) == ".html" || _url.slice(-4) == ".svg";
	}
}

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






function findComponentDefinition(el){
	var c = null;
  	window.components[el.getAttribute('name')] ? c = components[el.getAttribute('name')] : null;
  	return c;
}




function initComponentsInFrag(frag){
	var frag = frag || document;
	var cmp = frag.querySelectorAll('include');
	if(cmp.length < 1){return;}
	cmp.forEach(function(el,i){
		// console.log(el.getAttribute('name'));
		_src = el.getAttribute('src');
		if(_src){
			console.log('initializing include - ', el, ' inside - ', frag);
			var is_child_comp = frag != document ? true : false;
			loadComponent(el, fullComponentUrl(_src), is_child_comp);
		}
	})
}



if(document.readyState != "complete"){
	document.addEventListener('DOMContentLoaded', function(){
		initComponentsInFrag(document);
	},false);
}else{
	initComponentsInFrag(document);
}


export {
	IncludeFrag
}