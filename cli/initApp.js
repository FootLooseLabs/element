#!/usr/bin/env node

const fs = require("fs");
const path = require('path'); 

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
	var markup_files = {
					"index.src.html": indexHTMLMarkup,
					"gulpfile.js": gulpfileMarkup,
					"package.json": packagejsonMarkup,
					"rollup.config.js": rollupConfigMarkup,
					".gitignore": gitignoreMarkup,
					".babelrc": babelrcMarkup,
					"run.js": runserverMarkup,
					"components/index.js": componentIndexMarkup
				};

	var static_files = ["./static_files/css/base.css","./static_files/css/colors.css","./static_files/imgs/muffin.js.png"]

	for(var _filename in markup_files){
		fs.writeFileSync(_filename, generateMarkup(_filename, markup_files[_filename], opt), function (err) {
		  if (err) {console.log(err);}
		});
	}

	static_files.forEach((_filename)=>{
		console.log("copying: ", path.join(__dirname,_filename), ", to: ", _filename.replace("static_files","assets"));
		fs.copyFile(path.join(__dirname,_filename), _filename.replace("static_files","assets"), (err) => {
		  if (err) throw err;
		  console.log('source.txt was copied to destination.txt');
		});
	});
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