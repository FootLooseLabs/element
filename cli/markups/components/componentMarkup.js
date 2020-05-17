var componentMarkup = (opt) => {
opt.className = (opt.name.split("-").map((_text)=>{return _text._capitalize()})).join("");
// opt.schema = {...opt.schema, ...defaultCmpOpt.schema}

return `class ${opt.className} extends DOMComponent {
	static domElName = "${opt.name}" 

	static markupFunc = ${opt.markupFunc}
}

export { ${opt.className} };`
}

module.exports = { componentMarkup };