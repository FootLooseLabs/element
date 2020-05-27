import { randomString, stringToDocFrag, send_ajax } from "./utils.js";

function docFragParser(_docFrag, cmp_el_src){
	var t = _docFrag.querySelector('template');
	var doc = document.importNode(t.content,true);
	// var doc = link.import;
	// dd = doc;
	var docFrag = document.createDocumentFragment();
	// var scriptFrag = document.createDocumentFragment();

	if(_checkIfTerminatingCmpUrl(cmp_el_src)){
		cmp_el_src = cmp_el_src.split('/');
		cmp_el_src.pop();
		cmp_el_src = cmp_el_src.join('/');
	}


	while(doc.firstChild){ //any parsing tbd here
		var content = doc.firstChild;

		if(content.src){
			content.src = content.src[0] == "/" ? content.src : content.src = cmp_el_src + content.src.split(window.location.origin).pop();
		}
		if(content.href){
			content.href = content.href[0] == "/" ? content.href : content.href =  cmp_el_src + content.href.split(window.location.origin).pop();
		}

		// if(content.tagName=="SCRIPT"){
		// 	// console.log("FOUND SCRIPT = ", content);
		// 	scriptFrag.insertBefore(content, scriptFrag.firstChild); //so that order of scripts is same as in template
		// }else{
		// 	docFrag.appendChild(content);
		// }

		docFrag.insertBefore(content, docFrag.firstChild); //preserve order of content
	}

	return {_frag: docFrag }
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



class IncludeFrag extends HTMLElement {
	static domElName = "include-frag";

	constructor() {
		super();
		this.uid = this.uid || randomString(8);
		this._composeAncesstry();
	}

	loadDocFragIntoDom(docFrag){
		console.log("imp:","loading frag into dom - ", docFrag);

		var _parsed_frag = docFragParser(docFrag, this.src);

		this.replaceWith(_parsed_frag._frag);
	}

	async fetchFrag() {
		var _this = this;
		return new Promise((resolve, reject) => {
			fetch(this.src)
			  .then(
			    function(r) {
			    	console.log("imp:","fetched htmlfrag");
			    	r.text().then((text)=>{
			    		resolve(stringToDocFrag(text))
			    	});
			    	
			    }
			  )
			  .catch(function(e) {
			  		console.log("imp:","error loading htmlfrag - ", e);
			    	reject(e);
			  });
		});
	}

	async connectedCallback() {
	    this.src = this.attributes.src.value;
	    if(this.src){
	    	var frag = await this.fetchFrag();
	    	window.frag = frag;
	    	this.loadDocFragIntoDom(frag);
	    }
	}

	_composeAncesstry() {
		DOMComponentRegistry.update(this);
	   	console.log("composed ancesstry ", this.domElName, ", ", this.uid);
	}
}

export {
	IncludeFrag
}