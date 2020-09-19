const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

var AtomSignal = require('atom').Signal;

var signal = new AtomSignal({
	host: "127.0.0.1",
	port: 4444
})


var AppSpec = {
	"head": {
		title: "muffin-example-001",
		description: "muffin hello world",
		themeColor: "#312450",
		keywords: []
	}
}

var SPEC = {
	app_spec: AppSpec,
	project_dir: `${process.cwd()}/`
}

var initAppCLI = () => {
	rl.question(`Project title? (default: ${AppSpec.head.title}) `, (title) => {
		AppSpec.head.title = title || AppSpec.head.title;
		SPEC.project_dir += title.replace(/\s/g,'_'); //replace all the spaces anywhere in the string with underscores
	    rl.question(`description (to be put in webpage <head>) ? (default: ${AppSpec.head.description}) `, (description) => {
	    	AppSpec.head.description = description || AppSpec.head.description;
	    	rl.question(`theme color (to be put in webpage <head> meta) ? (default: ${AppSpec.head.themeColor}) `, (themeColor) => {
	    		AppSpec.head.themeColor = themeColor || AppSpec.head.themeColor;
	    		console.log("Initialised Muffin App - ", AppSpec.head.title);
	    		signal.sendWavelet("initApp",SPEC);
				// rl.close();
				// runCmd("python -m SimpleHTTPServer 8000", "app running on http://localhost:8000");
	    	});
	    });
	});

	rl.on("close", function() {
	    process.exit(0);
	});
}

module.exports = initAppCLI;