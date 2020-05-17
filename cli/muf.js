#!/usr/bin/env node
const readline = require("readline");
const { spawnSync, execSync } = require("child_process");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
.on('SIGINT', () => process.emit('SIGINT'))
.on('SIGTERM', () => process.emit('SIGTERM'));

const { program } = require('commander');

const { initApp } = require('./initApp.js');
var { initComponent } = require("./initComponent.js");


program
  .option('-d, --debug', 'output extra debugging')
  .option('-i, --init', 'initialise app')
  .option('-a, --add', 'add new component');

 if (process.argv.length <= 2) {
 	program.help();
 };

program.parse(process.argv);

// console.log("program = ", program);

// if (program.args.length === 0) {
//   program.help();
// }

var runCmd = (cmd, logMsg) => {
	if(!logMsg) { console.log("running: ", cmd); }
	else { console.log(logMsg); }
	var running = execSync(cmd, {stdio: 'inherit', shell: '/bin/bash'});
	return "Finish";
}


var AppConfig = {
	"head": {
		title: "muffin-example-001",
		description: "muffin hello world",
		themeColor: "#312450",
		keywords: []
	}
}

var init = () => {
	rl.question(`title of the webpage (to be put in webpage <head>)? (default: ${AppConfig.head.title}) `, (title) => {
		AppConfig.head.title = title || AppConfig.head.title;
	    rl.question(`description (to be put in webpage <head>) ? (default: ${AppConfig.head.description}) `, (description) => {
	    	AppConfig.head.description = description || AppConfig.head.description;
	    	rl.question(`theme color (to be put in webpage <head> meta) ? (default: ${AppConfig.head.themeColor}) `, (themeColor) => {
	    		AppConfig.head.themeColor = themeColor || AppConfig.head.themeColor;
	    		console.log("Initialised Muffin App - ", AppConfig.head.title);
	    		initApp(AppConfig);
	    		runCmd("npm install");
				// runCmd("npm run build");
				runCmd("npm run dev");
				// rl.close();
				// runCmd("python -m SimpleHTTPServer 8000", "app running on http://localhost:8000");
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
	    		initComponent(Cmp);
	    		rl.close();
	    	});
	    });
	});

	rl.on("close", function() {
	    process.exit(0);
	});
} 


process.on('exit', function() {
	console.log('process killing');
	// console.log('killing', children.length, 'child processes');
	// children.forEach(function(child) {
	// 	child.kill();
	// });
});

process.on('close', function() {
  console.log('process closing');
  // children.forEach(function(child) {
  //   child.kill();
  // });
});

if (program.debug) console.log(program.opts());
if (program.init) {
	console.log('initialising muffin app...');
	init();
};
if (program.add) {
	console.log('adding new component...');
	addNewComponent();
}