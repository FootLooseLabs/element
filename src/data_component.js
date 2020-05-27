import { randomString } from "./utils.js";

class DataChannel extends HTMLElement {

	static domElName = "data-channel";

	constructor() {
		super();
		this.uid = this.uid || randomString(8);
		this._composeAncesstry();
	}

	connectedCallback() {
		console.log("imp:","constructing data-channel = ", this.attributes);
	    this.label = this.attributes.label.value;
	    this.socket = this.attributes.socket.value;
	    this._cmp = this.previousElementSibling;
	    this._cmp.constructedFrom.__initDataSrcInterface(this.label, this.socket);
	}

	_composeAncesstry() {
		DOMComponentRegistry.update(this);
	   	console.log("composed ancesstry ", this.domElName, ", ", this.uid);
	}
}

// DataChannel.composeSelf = function(){
// 	DOMComponentRegistry.register(this.prototype.constructor);
// }

export {
	DataChannel
}