#!/usr/bin/env node

var fs = require("fs");

var { babelrcMarkup } = require("./markups/babelrcMarkup.js");
var { gitignoreMarkup } = require("./markups/gitignoreMarkup.js");
var { gulpfileMarkup } = require("./markups/gulpfileMarkup.js");
var { indexHTMLMarkup } = require("./markups/indexHtmlMarkup.js");
var { packagejsonMarkup } = require("./markups/packagejsonMarkup.js");
var { rollupConfigMarkup } = require("./markups/rollupConfigMarkup.js");
var { runserverMarkup } = require("./markups/runserverMarkup.js");

var { componentIndexMarkup } = require("./markups/components/indexMarkup.js");

var { generateMarkup } = require("./utils.js");
var { initComponent } = require("./initComponent.js");


var createProjectFiles = (opt) => {
	console.log("creating project files");
	var _files = {
					"index.src.html": indexHTMLMarkup,
					"gulpfile.js": gulpfileMarkup,
					"package.json": packagejsonMarkup,
					"rollup.config.js": rollupConfigMarkup,
					".gitignore": gitignoreMarkup,
					".babelrc": babelrcMarkup,
					"run.js": runserverMarkup,
					"components/index.js": componentIndexMarkup
				};
	for(var _filename in _files){
		fs.writeFileSync(_filename, generateMarkup(_filename, _files[_filename], opt), function (err) {
		  if (err) {console.log(err);}
		  console.log(_filename, ' file created successfully');
		});
	}
}

var createProjectFolders = (opt) => {
	console.log("creating project folders");
	var dirs = ["assets","components","pages", "assets/imgs", "assets/js", "assets/css", "assets/fonts"];

	dirs.forEach((_dir)=>{
		if (!fs.existsSync(_dir)){
		    fs.mkdirSync(_dir);
		}
		console.log(_dir, ' dir created successfully');
	});
}

var initApp = (opt) => {
	var opt = opt || {};
	// console.log("OPT == ", opt);
	createProjectFolders(opt);
	createProjectFiles(opt);
	initComponent();
}

module.exports = {
	"initApp" : initApp
}