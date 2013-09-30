module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    bookmarklet: {
      generate: {
        js: ['//justspamjustin.github.io/BrowserStig/public/js/vendor/underscore.js','//justspamjustin.github.io/BrowserStig/public/js/vendor/browserstig.js'],
        jsIds: ['underscore','browserstig'],
        body: 'twitter-example.js',
        out: 'bookmarklet.js',
        timestamp: true
      }
    }
  });

  // Load local tasks.
  grunt.loadNpmTasks('grunt-bookmarklet-thingy');

  // Default task.
  grunt.registerTask('default', 'bookmarklet');

};