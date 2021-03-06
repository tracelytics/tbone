'use strict';

var _ = require('lodash');
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var jshint = require('gulp-jshint');
var gzip = require('gulp-gzip');
var size = require('gulp-size');
var nodeunit = require('gulp-nodeunit');
var beautify = require('gulp-jsbeautifier');
var del = require('del');

var path = require('path');
var fs = require('fs-extra')
var spawn = require('child_process').spawn;

var dest = 'dist/';

gulp.task('clean', function (cb) {
  del([dest, 'test/dist'], cb);
});

var coreFiles = [
  'src/init.js',
  'src/model/core/sleep.js',
  'src/model/core/query.js',
  'src/model/core/base.js',
  'src/scheduler/timer.js',
  'src/scheduler/autorun.js',
  'src/scheduler/runlet.js',
  'src/scheduler/drainqueue.js',
  'src/model/core/bound.js',
];

var extFiles = coreFiles.concat([
  'src/model/core/async.js',
  'src/model/core/collection.js',
  'src/model/fancy/ajax.js',
  'src/model/fancy/localstorage.js',
  'src/model/fancy/location.js',
  'src/model/fancy/localstoragecoll.js',
  'src/ext/react_init.js',
]);

function wrapFiles (files) {
  return ['src/snippet/header.js'].concat(files).concat(['src/snippet/footer.js']);
}

var versions = {
  core: {
    files: wrapFiles(coreFiles),
    suffix: '_core',
  },
  core_debug: {
    files: wrapFiles(coreFiles),
    suffix: '_core_debug',
  },
  main: {
    files: wrapFiles(extFiles),
    suffix: '',
  },
  main_debug: {
    files: wrapFiles(extFiles),
    suffix: '_debug',
  }
};

_.each(versions, function (version, name) {
  var files = version.files;
  var suffix = version.suffix;
  function tn (n) {
    return n + ':' + name;
  }

  var jsFilename = 'tbone' + suffix + '.js';
  var jsFullPath = path.join(dest, jsFilename);
  var minJsFilename = 'tbone' + suffix + '.min.js';
  var minJsFullPath = path.join(dest, minJsFilename);
  var tmpFolder = 'tmp/test_' + name;

  gulp.task(tn('concat'), function () {
    return gulp.src(files)
      .pipe(concat(jsFilename))
      .pipe(gulp.dest(dest));
  });

  gulp.task(tn('jshint'), [tn('concat')], function () {
    return gulp.src([jsFullPath])
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'));
  });

  gulp.task(tn('compile'), [tn('concat'), tn('jshint')], function () {
    var isDebug = !!name.match(/debug/);
    return gulp.src([jsFullPath])
      .pipe(concat(minJsFilename))
      .pipe(replace(/var TBONE_DEBUG.+?\n/, '\n'))
      .pipe(sourcemaps.init())
      .pipe(uglify({
        compress: {
          unsafe: true,
          global_defs: { TBONE_DEBUG: isDebug },
        }
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(dest));
  });

  gulp.task(tn('compress'), [tn('compile')], function () {
    return gulp.src([minJsFullPath])
      .pipe(size({ showFiles: true }))
      .pipe(gzip({ gzipOptions: { level: 9 } }))
      .pipe(size({ showFiles: true }))
      .pipe(gulp.dest(dest));
  });

  gulp.task(tn('build'), [tn('concat'), tn('compile'), tn('compress')], _.noop);

  var testSources = [tmpFolder + '/core/**/*.js'];
  if (name.match(/^main/)) {
    testSources.push(tmpFolder + '/ext/**/*.js');
  }
  testSources.push('!' + path.join(tmpFolder, 'tbone.js'));

  gulp.task(tn('test'), [tn('build')], function() {
    fs.copySync('test/', tmpFolder);
    var tboneSrc = fs.readFileSync(jsFullPath, 'utf8');
    tboneSrc = tboneSrc.replace(/var TBONE_DEBUG.+?\n/, '\n');
    tboneSrc = tboneSrc.replace(/TBONE_DEBUG/g, 'global.TBONE_DEBUG');
    fs.writeFileSync(path.join(tmpFolder, 'tbone.js'), tboneSrc, 'utf8');
    global.TBONE_DEBUG = false;
    return gulp.src(testSources)
      .pipe(nodeunit({
        reporter: 'minimal_nocrash',
      }));
  });
  gulp.task(tn('test_debug'), [tn('test')], function() {
    global.TBONE_DEBUG = true;
    return gulp.src(testSources)
      .pipe(nodeunit({
        reporter: 'minimal_nocrash',
      }));
  });
});

var beautifyFiles = [
  // 'src/**/*.js',
  'test/**/*.js',
];

gulp.task('git-pre-js', function() {
  // beautify ungracefully throws an exception to indicate failure
  process.on('uncaughtException', function(err) {
    console.error(err.stack);
    process.exit(1);
  });
  var files = _.flatten();
  gulp.src(beautifyFiles)
    .pipe(beautify({
      config: '.jsbeautifyrc',
      mode: 'VERIFY_ONLY'
    }))
});

gulp.task('format-js', function() {
  gulp.src(beautifyFiles, {
      base: './'
    })
    .pipe(beautify({
      config: '.jsbeautifyrc',
      mode: 'VERIFY_AND_WRITE'
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('build_all', _.map(_.keys(versions), function (name) { return 'test:' + name; }), function (cb) {
  if (process.env.TARGET_PATH) {
    var srcFilename = 'tbone.js';
    gutil.log('Copying ' + gutil.colors.blue(srcFilename) + ' to ' + gutil.colors.blue(process.env.TARGET_PATH));
    fs.copy(path.join(dest, srcFilename), process.env.TARGET_PATH, cb);
  } else {
    cb();
  }
});
gulp.task('test', ['build_all']);
gulp.task('default', ['build_all']);

gulp.task('restart-gulp', function () {
  console.log('restarting gulp...');
  process.exit(0);
});

gulp.task('watch', ['build_all'], function () {
  gulp.watch(['gulpfile.js'], ['restart-gulp']);
  gulp.watch(['src/**/*.js', 'test/**/*.js'], ['build_all']);
});
