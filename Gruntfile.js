module.exports = function(grunt) {
  "use strict";
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        curly: true,
        forin: true,
        freeze: true,
        nonew: true,
        strict: true,
        undef: true, 
        unused: true,
        node: true,
        mocha: true,
        browser: true,
        latedef: 'nofunc',
        maxcomplexity: 8,
        maxdepth: 3,
        maxparams: 5,
        maxstatements: 30,
        globals: {
        }
      },
      all: ['Gruntfile.js', 'nodes/**/*.js', 'test/**/*.js']
    },
    simplemocha: {
      main: {
        src: ['test/**/*.js'],
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-simple-mocha');
  
  grunt.registerTask('default', ['lint', 'test']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('test', ['simplemocha']);
};