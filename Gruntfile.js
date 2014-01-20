module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Task Configuration
    clean: {
      dist: ['dist']
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: ['src/**/*.js']
      },
      //test: {
      //  src: ['test/**/*.js']
      //}
    },

    concat: {
      //options: {
      //  separator: ';',
      //},
      dist: {
        src: [
          'src/snippet/header.js',
          'src/init.js',
          'src/scheduler/timer.js',
          'src/scheduler/autorun.js',
          'src/scheduler/scope.js',
          'src/scheduler/drainqueue.js',
          'src/model/core/query.js',
          'src/model/core/base.js',
          'src/model/core/bound.js',
          'src/model/core/async.js',
          'src/model/core/collection.js',
          'src/model/fancy/sync.js',
          'src/model/fancy/ajax.js',
          'src/model/fancy/localstorage.js',
          'src/model/fancy/location.js',
          'src/model/fancy/localstoragecoll.js',
          'src/dom/template/init.js',
          'src/dom/template/render.js',
          'src/dom/view/hash.js',
          'src/dom/view/base.js',
          'src/dom/view/render.js',
          'src/dom/view/create.js',
          'src/export.js',
          'src/ext/bbsupport.js',
          'src/snippet/footer.js'
        ],
        dest: 'dist/<%= pkg.name %>.js',
      },
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },

    qunit: {
      files: ['test/static/index.html']
    },

    connect: {
      server: {
        options: {
          keepalive: true,
          port: 3000,
        }
      }
    },

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-recess');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'jshint', 'concat', 'qunit', 'uglify']);
  grunt.registerTask('server', ['default', 'connect']);

};