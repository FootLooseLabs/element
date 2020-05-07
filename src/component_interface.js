import PostOffice from "./post_office.js";

class MuffinComponentInterface extends Interface {
	static schema = {
		"sender": null,
		"label": "",
		"data": {}	
	}

	constructor(msg) {
		super(msg);
		var _this = this;
		PostOffice.registerBroker(this, this.label, ()=>{
			_this.apply();
		});
	}

	apply() {
	}
}

class MuffinComponentResponse extends Interface {
	static schema = {
		"sender": null,
		"label": "",
		"data": {}	
	}

	apply() {
		PostOffice.broadcastMsg();
	}
}