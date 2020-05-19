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
					"src/index.src.html": indexHTMLMarkup,
					"gulpfile.js": gulpfileMarkup,
					"package.json": packagejsonMarkup,
					"rollup.config.js": rollupConfigMarkup,
					".gitignore": gitignoreMarkup,
					".babelrc": babelrcMarkup,
					"run.js": runserverMarkup,
					"src/components/index.js": componentIndexMarkup
				};

	var static_files = ["./res/static/imgs/muffin.js.png"]
	var styles = ["./res/styles/base.css","./res/styles/colors.css"]

	for(var _filename in markup_files){
		fs.writeFileSync(_filename, generateMarkup(_filename, markup_files[_filename], opt), function (err) {
		  if (err) {console.log(err);}
		});
	}

	static_files.forEach((_filename)=>{
		console.log("copying: ", path.join(__dirname,_filename), ", to: ", _filename.replace("res","src/assets"));
		fs.copyFile(path.join(__dirname,_filename), _filename.replace("res/static","src/assets"), (err) => {
		  if (err) throw err;
		});
	});

	styles.forEach((_filename)=>{
		console.log("copying: ", path.join(__dirname,_filename), ", to: ", _filename.replace("res","src"));
		fs.copyFile(path.join(__dirname,_filename), _filename.replace("res","src"), (err) => {
		  if (err) throw err;
		});
	});
}

var createProjectFolders = (opt) => {
	console.log("creating project folders");
	var dirs = ["src",
				"src/components", 
				"src/scripts", 
				"src/styles",
				"src/pages",
				"src/assets",
				"src/assets/imgs", 
				"src/assets/fonts",
				"src/assets/webfonts",
				"src/assets/videos"
				];

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