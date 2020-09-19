var zmq = require("zeromq"),
  sock = zmq.socket("pub");


let _port = process.argv[2] || 3333;
var _topic = process.argv[3] || "getUsers";
var _payload = process.argv[4] || {
	name: "ankur",
	email: "ankur@footloose.io",
	_type: "drona-hmi-demo-susbcriber"
};

// var testInterval = process.argv[5] || 3000;

// setInterval(function() {
  
// }, testInterval);


function discoverAndConnect(cmpLabel=cmpLabel) {
	diont.on("serviceAnnounced", function(serviceInfo) {
		// A service was announced
		// This function triggers for services not yet available in diont.getServiceInfos()
		// serviceInfo is an Object { isOurService : Boolean, service: Object }
		// service.name, service.host and service.port are always filled
		console.log("A new service was announced", serviceInfo.service);
		// List currently known services
		console.log("All known services", diont.getServiceInfos());
	});
}


function discover(port=_port) {
	sock.bindSync(`tcp://127.0.0.1:${port}`);
	console.log(`Pubber bound to port ${port}`);
}

function connect(port=_port) {
	sock.bindSync(`tcp://127.0.0.1:${port}`);
	console.log(`Pubber bound to port ${port}`);
}

function signal(topic=_topic, payload=_payload){
	console.log("sending payload - ", `${topic}`, `${payload}`);
	sock.send([topic, JSON.stringify(payload)]);
}