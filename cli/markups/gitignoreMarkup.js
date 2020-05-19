var gitignoreMarkup = (opt) => {
return `venv
node_modules
.DS_Store
*.min.js
*.min.css
index.html
_cmps_tmp
dist`
}

module.exports = {
	gitignoreMarkup
}