var gulpfileMarkup = (opt) => {
return `const path = require('path'); 

var gulp = require('gulp');
var concat = require('gulp-concat');
var concatCss = require('gulp-concat-css');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var uglifyCss = require('gulp-uglifycss');
var htmlmin = require('gulp-htmlmin');
var inlinesource = require('gulp-inline-source');
var run = require('gulp-run-command').default;
var del = require("del");

var srcDir = "src/"
var distDir = "dist/"

//VARIABLES
var cmpDistTmpFile = "_cmps_tmp/_cmps.js";
var jsFiles = ['scripts/*.js'];
var jsDest = 'scripts/';

var cssFiles = ['styles/*.css'];
var cssDest = 'styles/';

var htmlFiles = ['index.src.html'];
var htmlDest = '.';


var getSrcDirs = (_dirs) => {
    return _dirs.map((_dir)=>{
        return path.join(srcDir,_dir);
    });
}

var getDestDir = (_dir) => {
    return path.join(distDir,_dir);
}


gulp.task('buildWebComponents', run("./node_modules/.bin/rollup -c"));


gulp.task('buildJs', function() {
    return gulp.src([].concat(getSrcDirs(jsFiles),cmpDistTmpFile))
        .pipe(concat('app.js'))
        // .pipe(gulp.dest(jsDest))
        .pipe(rename('app.min.js'))
        // .pipe(uglify())
        .pipe(gulp.dest(getDestDir(jsDest)));
});

gulp.task('buildCss', function() {
    return gulp.src(getSrcDirs(cssFiles))
        .pipe(concatCss('app.css'))
        // .pipe(gulp.dest(jsDest))
        .pipe(rename('app.min.css'))
        .pipe(uglifyCss({
            "maxLineLen": 80,
            "uglyComments": true
        }))
        .pipe(gulp.dest(getDestDir(cssDest)));
});


// gulp.task('buildIncludeFragments', run("./node_modules/.bin/rollup -c"));


gulp.task('buildHtml', () => {
    var options = {
        compress: false,
        attribute: 'inline-src'
    };
    return gulp.src(getSrcDirs(htmlFiles))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest(getDestDir(htmlDest)))
        .pipe(inlinesource(options))
        .pipe(gulp.dest(getDestDir(htmlDest)));
});


var staticAssetsDir = 'assets/';
var getStaticSrcDir = (_dir)=> {
    return path.join(srcDir,staticAssetsDir,_dir,"*");
}

gulp.task('copyImageAssets', function() {
  return gulp.src(getStaticSrcDir("imgs"))
    .pipe(gulp.dest('./dist/assets/imgs'));
});

gulp.task('copyVideoAssets', function() {
  return gulp.src(getStaticSrcDir("videos"))
    .pipe(gulp.dest('./dist/assets/videos'));
});

gulp.task('copyFontAssets', function() {
  return gulp.src(getStaticSrcDir("fonts"))
    .pipe(gulp.dest('./dist/assets/fonts'));
});

gulp.task('copyWebFontAssets', function() {
  return gulp.src(getStaticSrcDir("webfonts"))
    .pipe(gulp.dest('./dist/assets/webfonts'));
});

gulp.task('copyStaticAssets', gulp.series('copyImageAssets', 'copyVideoAssets', 'copyFontAssets', 'copyWebFontAssets'));

// gulp.task('clean', function(){
//      return del('dist/**', {force:true});
// });

sanitise = () => {
    del('_cmps_tmp', {force:true})
}

gulp.task('buildAll', gulp.series('buildWebComponents', 'buildCss', 'buildJs', 'copyStaticAssets','buildHtml', function done(done) {
    sanitise();
    done();
}));`
}

module.exports = {
    gulpfileMarkup
}