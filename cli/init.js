#!/usr/bin/env node

var fs = require("fs");

var { generateMarkup } = require("./utils.js");
var { createComponent } = require("./create_component.js");

var pageSchemaDefaults = {
	"head": {
		"themeColor": "#312450",
		"keywords": []
	}
}

var indexHTMLMarkup = (_data) => {
_data.head = {..._data.head, ...pageSchemaDefaults.head}
// console.log("DATA = ", _data);
return `<!DOCTYPE HTML>
<html>
	<head>
	    <title>${_data.head.title}</title>
	    <meta charset="UTF-8" />
	    <meta http-equiv="X-UA-Compatible" content="IE=edge">
	    <meta name="description" content="${_data.head.description}" />
	    <meta name="keywords" content="${_data.head.keywords.join(', ')}" />
	    <meta charset="utf-8" />

	    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, user-scalable=no">
	    <meta http-equiv="ScreenOrientation" content="autoRotate:disabled">
	    <meta name="theme-color" content="${_data.head.themeColor}" />

	    <meta property="og:image" content="./assets/imgs/logo_2.1.png">
	    <meta name="twitter:image" content="./assets/imgs/logo_2.1.png">
	    <meta name="twitter:card" content="./assets/imgs/logo_2.1.png">
	    <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js"></script>
	    <script src="/node_modules/muffin/dist/muffin.min.js"></script>
	</head>

	<body>
	    <div class="page" route="contact-page">
	         <contact-card></contact-card>
	    </div>
	    <div class="page" route="about-page">
	         <contact-card></contact-card>
	    </div>
	    <script type="text/javascript" src="/components/dist/_cmps.js"></script>
	    <script type="text/javascript">
	        var routeOpts = [
	        ];
	        var _router = new Router();
	        _router.addRouteConfig(routeOpts);
	    </script>
	</body>
</html>`
}


var packageJsonMarkup = (opt) => {
opt.head = {...opt.head, ...pageSchemaDefaults.head}

return `{
    "name": "${opt.head.name}",
    "version": "${opt.version || '0.0.1'}",
    "description": "${opt.head.description}",
    "main": "index.js",
    "scripts": {
        "build": "gulp buildCss && gulp buildJs && gulp buildWebComponents && gulp buildHtml",
        "deploy": "aws s3 sync . ${opt.s3_url} --exclude 'gulpfile.js'  --exclude 'node_modules/*'  --exclude 'package.json'  --exclude 'package-lock.json'  --exclude '.git/*'"
    },
    "author": "${opt.author || 'footloose.io'}",
    "license": "${opt.license || 'ISC'}",
    "devDependencies": {
        "gulp": "^4.0.2",
        "gulp-concat": "^2.6.1",
        "gulp-concat-css": "^3.1.0",
        "gulp-rename": "^1.4.0",
        "gulp-uglify": "^3.0.2",
        "gulp-uglify-es": "^2.0.0",
        "gulp-uglifycss": "^1.1.0",
        "uglify-es": "^3.3.9",
        "gulp-htmlmin": "^5.0.1"
    },
    "dependencies": {
        "muffin": "file:/home/a-ankur/footloose_labs/productivity/muffin",
        "localforage": "^1.7.3"
    }
}`
}

var gulpfileJsMarkup = (opt) => {
return `var gulp = require('gulp');
var concat = require('gulp-concat');
var concatCss = require('gulp-concat-css');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify-es').default; //no longer maintained - need to find a suitable alternative (also to include es6 code in dom_components.js which is currently directly added in index.src.html's head)
var uglifyCss = require('gulp-uglifycss');
var htmlmin = require('gulp-htmlmin');

function defaultTask(cb) {
  // place code for your default task here
  cb();
}

//script paths
var jsFiles = ['assets/js/*.js', '!assets/js/dist/*.js'];

var jsDest = 'assets/js/dist/';

gulp.task('buildJs', function() {
    return gulp.src(jsFiles)
        .pipe(concat('app.js'))
        // .pipe(gulp.dest(jsDest))
        .pipe(rename('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(jsDest));
});

var web_component_files_src = ['components/*.js','components/**/*.js','!components/dist/*.js'];
var web_component_files_dist = 'components/dist/';
gulp.task('buildWebComponents', function() {
    return gulp.src(web_component_files_src)
        .pipe(concat('_cmps.js'))
        .pipe(gulp.dest(web_component_files_dist))
        // .pipe(rename('_cmps.min.js'))
        // .pipe(uglify())
        // .pipe(gulp.dest(web_component_files_dist));
});

//css paths
var cssFiles = ['assets/css/*.css', '!assets/css/dist/*.css'];
var cssDest = 'assets/css/dist/';

gulp.task('buildCss', function() {
    return gulp.src(cssFiles)
        .pipe(concatCss('app.css'))
        // .pipe(gulp.dest(jsDest))
        .pipe(rename('app.min.css'))
        .pipe(uglifyCss({
	      "maxLineLen": 80,
	      "uglyComments": true
	    }))
        .pipe(gulp.dest(cssDest));
});

var htmlFiles = ['index.src.html'];
var htmlDest = '.';

gulp.task('buildHtml', () => {
  return gulp.src(htmlFiles)
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(htmlDest));
});
`
}

var swJsMarkup = (opt) => {
	
}

var gitignoreMarkup = (opt) => {
return `venv
node_modules
.DS_Store
*.min.js
index.html
components/dist/_cmps.js
assets/dist`
}

var createProjectFiles = (opt) => {
	console.log("creating project files");
	var _files = {
					"index.src.html": indexHTMLMarkup,
					"gulpfile.js": gulpfileJsMarkup,
					"package.json": packageJsonMarkup,
					"sw.js": swJsMarkup,
					".gitignore": gitignoreMarkup
				};
	for(var _filename in _files){
		fs.writeFileSync(_filename, generateMarkup(_filename, _files[_filename], opt), function (err) {
		  if (err) {console.log(err);}
		  console.log(_filename, ' file created successfully');
		});
	}
}

var createProjectFolders = (opt) => {
	console.log("creating project folders");
	var dirs = ["assets","components","pages", "assets/imgs", "assets/js", "assets/css", "assets/fonts"];

	dirs.forEach((_dir)=>{
		if (!fs.existsSync(_dir)){
		    fs.mkdirSync(_dir);
		}
		console.log(_dir, ' dir created successfully');
	});
}

var initApp = (opt) => {
	var opt = opt || {};
	// console.log("OPT == ", opt);
	createProjectFolders(opt);
	createProjectFiles(opt);
	createComponent();
}

module.exports = {
	"initApp" : initApp
}