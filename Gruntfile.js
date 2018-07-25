var chalk= require('chalk')
var moment= require('moment')

module.exports = function (grunt) {
  'use strict';
  require("load-grunt-tasks")(grunt);
  grunt.initConfig({
    jshint: {
      sdk: {
        src: ['*.js', 'src/*.js', 'example/*.js']
      },
      options: {
        jshintrc: '.jshintrc'
      },
      test:{
        src:['./tests/**/*Spec.js']
      }
    },

    copy: {
      'test-specs': {
        expand: true,
        src: ['test/**/*spec.js'],
        dest: 'build/test/specs',
        options:{}
      },
      'browserify-dist-setup': {
        expand: true,
        src: ['api/**/*.js'],
        dest: 'build/dist/',
        options: {}
      },
      'browserify-test-setup': {
        expand: true,
        src: ['api/**/*.js'],
        dest: 'build/test/src',
        options: {}
      }
    },

    babel: {
        options: {
          sourceMap: true,
          presets: ['es2015']
        },
        dist:{
          files: {
            'dist/fast-recorder-transpiled.js':  'dist/fast-recorder.js'
          }
        },
        test:{
           options:{
             sourceMap:false,
             presets:['es2015','es2016']
           },
           files:{
             'build/test/transpiled/analyser.js': 'build/test/src/api/analyser.js',
             'build/test/transpiled/helpers.js': 'build/test/src/api/helpers.js',
             'build/test/transpiled/recorder.js': 'build/test/src/api/recorder.js',
             'build/test/transpiled/sampleAudio.js': 'build/test/src/api/sampleAudio.js',
             'build/test/transpiled/audioBuffer.js': 'build/test/src/api/audioBuffer.js',
             'build/test/transpiled/main.js': 'build/test/src/api/main.js',
           }
        }
    },

    browserify: {
      test: {
        files: {
          'build/test/browser/main.js': 'build/test/transpiled/main.js',
          'build/test/browser/specs.js': ['build/test/specs/**/*spec.js']
        }
      },
      dist: {
        files: {
          'dist/fast-recorder.js': 'build/dist/api/main.js'
        }
      }
    },

    uglify: {
      test: {
        files: {
          'build/test/browser/main.min.js': 'build/test/browser/main.js',
        }
      },
      dist: {
        files: {
          'dist/fast-recorder.min.js': 'dist/fast-recorder-transpiled.js'
        }
      }
    },
    
    // phamtomJS doesnt recognize the javascript browser api
    karma:{
      unit:{
         options:{
            frameworks: ['jasmine'],
            singleRun: false,
            browsers: ['Chrome'],
            coverage: true,
            files: [
              'build/test/browser/main.min.js',
              'build/test/browser/specs.js'
            ]
         }
      }
    },

    watch: {
      scripts: {
        files: ['api/*.js', 'example/*.*', 'test/*tests.js', 'Gruntfile.js'],
        tasks: ['release'],
        options: {
          spawn: false,
        }
      }
    },

    clean: {
      build: {
        options: {
          force: true
        },
        src: ['./build/**']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-jasmine')
  //grunt.loadNpmTasks('grunt-babel')
  //grunt.loadNpmTasks('grunt-es6-transpiler')

  // client-side tests
  grunt.registerTask('test-setup', ['copy:test-specs', 'copy:browserify-test-setup','babel:test','browserify:test', 'uglify:test', 'karma']);
  // test, dist and release
  grunt.registerTask('test', ['clean','test-setup']);


  grunt.registerTask('dist', ['copy:browserify-dist-setup','browserify:dist','babel:dist','uglify:dist']);
  grunt.registerTask('finishTime','release finish time',function(){
    var Now= moment().format('MMMM Do YYYY, h:mm a')
    grunt.log.write(chalk.blue('FINISH TIME: ' ) + Now)
  })


  grunt.registerTask('release', ['clean','dist','finishTime']);

   // A very basic default task.
   grunt.registerTask('default', 'Log some stuff.', function() {
    grunt.log.write('Logging some stupid stuff...').ok();
  });

};