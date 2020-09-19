const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

var AtomSignal = require('atom').Signal;

var signal = new AtomSignal({
	port: 4444
})

var Cmp = {
	name: "contact-card",
	schema: { "name": "Muffin", "email": "muffin@footloose.io", "phone_no": "0000000000" },
	markupFunc: (_data) => { return `<h1>${_data.name}</h1><h3 class="contact">${_data. email} <br/> ${_data.phone_no}</h3>`}
}

var SPEC = {
	cmp_spec: Cmp,
	projectDir: process.cwd()
}

var addNewComponentCLI = () => {
	rl.question("Name of component? ", (cmp_name) => {
		Cmp.name = cmp_name || Cmp.name;
	    rl.question("Schema of component? ", (cmp_schema) => {
	    	Cmp.schema = cmp_schema || Cmp.schema;
	    	rl.question("markupFunc of the component ? ", (cmp_markupFunc) => {
	    		Cmp.markupFunc = cmp_markupFunc || Cmp.markupFunc;
	    		console.log("initialised muffin app - ", Cmp.name);
	    		signal.sendWavelet("initComponent", SPEC);
	    		rl.close();
	    	});
	    });
	});

	rl.on("close", function() {
	    process.exit(0);
	});
} 

module.exports = addNewComponentCLI;