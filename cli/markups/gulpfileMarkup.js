var gulpfileMarkup = (opt) => {
return `var gulp = require('gulp');
var concat = require('gulp-concat');
var concatCss = require('gulp-concat-css');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var uglifyCss = require('gulp-uglifycss');
var htmlmin = require('gulp-htmlmin');
var inlinesource = require('gulp-inline-source');
var run = require('gulp-run-command').default;


//VARIABLES
var jsFiles = ['assets/js/*.js', '!assets/js/dist/*.js', 'dist/*.js'];
var jsDest = 'assets/js/dist/';

var cssFiles = ['assets/css/*.css', '!assets/css/dist/*.css'];
var cssDest = 'assets/css/dist/';

var htmlFiles = ['index.src.html'];
var htmlDest = '.';



gulp.task('buildWebComponents', run("./node_modules/.bin/rollup -c"));

gulp.task('buildJs', function() {
    return gulp.src(jsFiles)
        .pipe(concat('app.js'))
        // .pipe(gulp.dest(jsDest))
        .pipe(rename('app.min.js'))
        // .pipe(uglify())
        .pipe(gulp.dest(jsDest));
});

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


gulp.task('buildIncludeFragments', run("./node_modules/.bin/rollup -c"));


gulp.task('buildHtml', () => {
    var options = {
        compress: false
    };
    return gulp.src(htmlFiles)
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(inlinesource(options))
        .pipe(rename('index.html'))
        .pipe(gulp.dest(htmlDest));
});


gulp.task('buildAll', gulp.series('buildWebComponents', 'buildCss', 'buildJs', 'buildHtml', function done(done) {
    done();
}));`
}

module.exports = {
    gulpfileMarkup
}