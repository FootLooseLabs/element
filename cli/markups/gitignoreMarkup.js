var gitignoreMarkup = (opt) => {
return `venv
node_modules
.DS_Store
*.min.js
*.min.css
index.html
components/dist/
assets/js/dist
assets/css/dist
dist/`
}

module.exports = {
	gitignoreMarkup
}