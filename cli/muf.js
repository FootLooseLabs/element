#!/usr/bin/env node
const readline = require("readline");
const { execSync } = require("child_process");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const { program } = require('commander');

const { initApp } = require('./init.js');
var { createComponent } = require("./create_component.js");


program
  .option('-d, --debug', 'output extra debugging')
  .option('-i, --init', 'initialise app')
  .option('-a, --add', 'add new component');

program.parse(process.argv);


var runCmd = (cmd, logMsg) => {
	if(!logMsg) { console.log("running: ", cmd); }
	else { console.log(logMsg); }
	execSync(cmd, (error, stdout, stderr) => {
	    if (error) {
	        console.log(`error: ${error.message}`);
	        return;
	    }
	    if (stderr) {
	        console.log(`stderr: ${stderr}`);
	        return;
	    }
	    console.log(`stdout: ${stdout}`);
	});
}


var App = {
	"head": {
		title: "muffin-example-001",
		description: "muffin example app 001",
		themeColor: "#312450",
		keywords: []
	}
}

var init = () => {
	rl.question("title of the webpage (to be put in webpage <head>)? ", (title) => {
		App.head.title = title || App.head.title;
	    rl.question("description (to be put in webpage <head>) ? ", (description) => {
	    	App.head.description = description || App.head.description;
	    	rl.question("theme color (to be put in webpage <head> meta) ? ", (themeColor) => {
	    		App.head.themeColor = themeColor || App.head.themeColor;
	    		console.log("initialised muffin app - ", App.head.title);
	    		initApp(App);
	    		runCmd("npm install");
				runCmd("npm run build");
				runCmd("python -m SimpleHTTPServer 8000", "app running on http://localhost:8000");
	    	});
	    });
	});

	rl.on("close", function() {
	    process.exit(0);
	});
}


var Cmp = {
					name: "contact-card",
					schema: { "name": "Muffin", "email": "muffin@footloose.io", "phone_no": "0000000000" },
					markupFunc: (_data) => { return `<h1>${_data.name}</h1><h3 class="contact">${_data. email} <br/> ${_data.phone_no}</h3>`}
				}

var addNewComponent = () => {
	rl.question("Name of component? ", (cmp_name) => {
		Cmp.name = cmp_name || Cmp.name;
	    rl.question("Schema of component? ", (cmp_schema) => {
	    	Cmp.schema = cmp_schema || Cmp.schema;
	    	rl.question("markupFunc of the component ? ", (cmp_markupFunc) => {
	    		Cmp.markupFunc = cmp_markupFunc || Cmp.markupFunc;
	    		console.log("initialised muffin app - ", Cmp.name);
	    		createComponent(Cmp);
	    		rl.close();
	    	});
	    });
	});

	rl.on("close", function() {
	    process.exit(0);
	});
} 

if (program.debug) console.log(program.opts());
if (program.init) {
	console.log('initialising muffin app - ', program.init);
	init();
};
if (program.add) {
	console.log('adding new component...');
	addNewComponent();
}




