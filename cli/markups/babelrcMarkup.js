var babelrcMarkup = ()=>{
return `// with options
{
  "plugins": [
    ["transform-class-properties", { "spec": true }]
  ]
}`
}

module.exports = {
	babelrcMarkup
}