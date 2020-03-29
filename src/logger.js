(() => {
	var __log = console.log;
	console.log = function() {
		if(arguments[0]==="imp:"){
			var argumentsArr = Array.prototype.slice.call(arguments);
			var msgArr = argumentsArr.slice(1,argumentsArr.length)
			__log.apply(this, msgArr);
		}
		if(window.LOGGING_LEVEL !== "DEBUG"){return;}
    	__log.apply(this, arguments);
	}
})();


var styles = {
	"imp": "font-weight: bold; color: #1B2B34;",
	"debug": "font-weight: bold; color: #EC5f67;",
	"info": "font-weight: bold; color: #F99157;",
	"warn": "font-weight: bold; color: #FAC863;",
	"error": "font-weight: bold; color: #99C794;"
}