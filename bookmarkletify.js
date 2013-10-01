var fs = require('fs');
var b = require('bookmarkletify');
var browserstig = fs.readFileSync('browserstig.js').toString();
var example = fs.readFileSync('twitter-example.js').toString();
fs.writeFileSync('bookmarklet.js', b(browserstig + example));