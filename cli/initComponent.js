var fs = require("fs");
var { generateMarkup } = require("./utils.js");
var { componentMarkup } = require("./markups/components/componentMarkup.js");

var defaultCmpOpt = {
					name: "hello-world",
					markupFunc: (_data, uid, uiVars, _constructor) => { 
						return `<div class="w100 h100">
									<div class="align-vertical-center center">
										<h3 class="tx-xxl">Muffin.js : Hello There.</h3>
									</div>
								</div>`
					}
				}



var initComponent = (cmpObj) => {
	var cmpObj = cmpObj || defaultCmpOpt;
	console.log("creating component - ", cmpObj.name);
	var _filename = "components/" + cmpObj.name + ".js";
	fs.writeFileSync(_filename, generateMarkup(_filename, componentMarkup, cmpObj), function (err) {
	  if (err) {console.log(err);}
	  console.log(_filename, ' component created successfully');
	});
}

module.exports = {
	"initComponent" : initComponent
}

