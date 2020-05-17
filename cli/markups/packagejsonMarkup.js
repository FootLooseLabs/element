var packagejsonMarkup = (opt) => {
return `{
    "name": "${opt.head.title}",
    "version": "${opt.version || '0.0.1'}",
    "description": "${opt.head.description}",
    "main": "index.js",
    "scripts": {
        "build": "gulp buildAll",
        "deploy": "aws s3 sync . ${opt.s3_url} --exclude 'gulpfile.js'  --exclude 'node_modules/*'  --exclude 'package.json'  --exclude 'package-lock.json'  --exclude '.git/*'",
        "dev": "watch 'npm run build && node run.js' components && watch 'npm run build && node run.js' index.src.html && watch 'npm run build && node run.js' assets"
    },
    "author": "${opt.author || 'footloose.io'}",
    "license": "${opt.license || 'ISC'}",
    "devDependencies": {
        "@babel/cli": "^7.1.2",
        "@babel/core": "^7.1.2",
        "babel-cli": "^6.26.0",
        "babel-plugin-transform-class-properties": "^6.24.1",
        "gulp": "^4.0.2",
        "gulp-concat": "^2.6.1",
        "gulp-concat-css": "^3.1.0",
        "gulp-htmlmin": "^5.0.1",
        "gulp-inline-source": "^4.0.0",
        "gulp-rename": "^1.4.0",
        "gulp-run-command": "0.0.10",
        "gulp-uglify": "^3.0.2",
        "gulp-uglifycss": "^1.1.0",
        "rollup": "^0.66.6",
        "rollup-plugin-babel": "^4.4.0",
        "rollup-plugin-commonjs": "^9.2.0",
        "rollup-plugin-node-resolve": "^3.4.0",
        "rollup-plugin-replace": "^2.1.0",
        "rollup-plugin-uglify": "^6.0.0",
        "uglify-es": "^3.3.9",
        "watch": "^1.0.2",
        "finalhandler": "^1.1.2",
        "kill-port": "^1.6.0",
        "serve-static": "^1.14.1"
    },
    "dependencies": {
        "muffin": "github:FootLooseLabs/muffin"
    }
}`
}

module.exports = {
    packagejsonMarkup
}