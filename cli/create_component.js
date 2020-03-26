var fs = require("fs");
var { generateMarkup } = require("./utils.js");

defaultCmpOpt = {
					name: "contact-card",
					schema: { "name": "Muffin", "email": "muffin@footloose.io", "phone_no": "0000000000" },
					markupFunc: (_data) => { return `<h1>${_data.name}</h1><h3 class="contact">${_data. email} <br/> ${_data.phone_no}</h3>`}
				}


var componentMarkup = (opt) => {
opt.className = (opt.name.split("-").map((_text)=>{return _text._capitalize()})).join("");
opt.schema = {...opt.schema, ...defaultCmpOpt.schema}

return `class ${opt.className} extends DOMComponent {
	static domElName = "${opt.name}" 

	static schema = ${JSON.stringify(opt.schema)}

	static markupFunc = ${opt.markupFunc}
}

customElements.define("${opt.name}", ${opt.className});`
}


var createComponent = (opt) => {
	var opt = opt || defaultCmpOpt;
	console.log("creating component - ", opt.name);
	var _filename = "components/" + opt.name + ".js";
	fs.writeFileSync(_filename, generateMarkup(_filename, componentMarkup, opt), function (err) {
	  if (err) {console.log(err);}
	  console.log(_filename, ' component created successfully');
	});
}

module.exports = {
	"createComponent" : createComponent
}

