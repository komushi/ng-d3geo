module.exports = function (grunt) {
  var _pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({
    pkg: _pkg,
    uglify: {
      options: {
        mangle: false
      },
      js: {
          files: {
              'dist/ng-d3geo.min.js': ['src/ng-d3geo.js']
          }
      }
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      target: {
        files: {
            'dist/css/ng-d3geo.min.css' : ['src/css/ng-d3geo.css']
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.registerTask('default', ['cssmin', 'uglify']);
}
