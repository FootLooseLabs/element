String.prototype._capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

var generateMarkup = (_filename, markupFunc, opt) => {
	try {
		var markup = markupFunc(opt) || "";
		console.log("generated ", _filename);
		// console.log("generated markup for ", _filename, " with data: \n\n", opt, "\n\n\n");
		return markup;
	}catch(err){
		console.error(err);
	}
}


module.exports = {
	"generateMarkup": generateMarkup
}