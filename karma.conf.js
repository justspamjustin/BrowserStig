// Karma configuration
// Generated on Tue Oct 01 2013 09:36:44 GMT-0600 (MDT)
var fs = require('fs');
var colors = require('colors');
var _ = require('underscore');
var argv = require('optimist');

var stigConfigPath = 'browserstig.conf.js';

var defaultStigConfig = {
  basePath: '',
  files: [],
  main: null,
  framework: 'mocha', // jasmine, mocha, qunit
  reporters: ['progress'],
  exclude: [],
  browser: 'Chrome',
  automatedUrl: 'http://localhost'
};

var stigConfig = {};
if (fs.existsSync(stigConfigPath)) {
  stigConfig = fs.readFileSync(stigConfigPath);
  stigConfig = _.extend({}, defaultStigConfig, stigConfig);
} else {
  console.error(('[Error] ' + stigConfigPath + ' does not exist.  Run "browserstig init" to create your configuration.').yellow);
  process.exit(1);
}


module.exports = function(config) {
  var files = [
    __dirname + '/BrowserStig.js'
  ];

  if (stigConfig.main) {
    files.push(stigConfig.main);
  }

  files = files.concat(stigConfig.files);

  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: stigConfig.basePath,


    // frameworks to use
    frameworks: [stigConfig.framework],


    // list of files / patterns to load in the browser
    files: files,


    // list of files to exclude
    exclude: stigConfig.exclude,


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: stigConfig.reporters,


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [argv.browser || process.env.BROWSER || stigConfig.browser],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

    urlRoot: '/runtests',

    proxies: {
      '/': argv.automatedUrl || process.env.AUTOMATED_URL || stigConfig.automatedUrl
    }
  });
};
