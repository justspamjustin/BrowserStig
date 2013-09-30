module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    bookmarklet: {
      generate: {
        js: ['//justspamjustin.github.io/BrowserStig/public/js/vendor/browserstig.js'],
        css: [],
        jsIds: ['browserstig'],
        body: 'twitter-example.js',
        out: 'bookmarklet.js'
      }
    }
  });

  // Load local tasks.
  grunt.loadNpmTasks('grunt-bookmarklet-thingy');

  // Default task.
  grunt.registerTask('default', 'bookmarklet');

};