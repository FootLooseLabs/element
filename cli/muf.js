#!/usr/bin/env node
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const { program } = require('commander');

const { initApp } = require('./init.js');


program
  .option('-d, --debug', 'output extra debugging')
  .option('-i, --init', 'initialise app')
  .option('-p, --pizza-type <type>', 'flavour of pizza');

program.parse(process.argv);



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
if (program.pizzaType) console.log(`- ${program.pizzaType}`);




