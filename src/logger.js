class Logger {
	static styles = {
		"imp": "font-weight: bold; color: #1B2B34;",
		"debug": "font-weight: bold; color: #EC5f67;",
		"info": "font-weight: bold; color: #F99157;",
		"warn": "font-weight: bold; color: #FAC863;",
		"error": "font-weight: bold; color: #99C794;"
	}
}

Logger.start = () => {
	Logger.__log = console.log;
	console.log = function() {
		if(MUFFIN_CONFIG.LOGGING_LEVEL == "NONE"){return;}

		if(arguments[0]==="imp:"){
			var argumentsArr = Array.prototype.slice.call(arguments);
			var msgArr = argumentsArr.slice(1,argumentsArr.length)
			Logger.__log.apply(this, msgArr);
		}

		if(MUFFIN_CONFIG.LOGGING_LEVEL !== "DEBUG"){return;}
    	Logger.__log.apply(this, arguments);
	}
};

export { 
	Logger
}