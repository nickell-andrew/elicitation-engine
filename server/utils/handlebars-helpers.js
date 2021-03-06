var includeStatic = require('../elicitation/static-includes');

// The easiest way to make sure we have the /same/ version of handlebars
// as used inside express-handlebars is to create a blank instance, ugh.
var exphbs = require('express-handlebars');
var Handlebars = exphbs.create().handlebars;

module.exports = function (assetHelpers) {
  return {
        includeStatic: function(filename) { return new Handlebars.SafeString(includeStatic(filename)); },
        css: function(filename) { return new Handlebars.SafeString(assetHelpers.css(filename)); },
        js: function(filename) { return new Handlebars.SafeString(assetHelpers.js(filename)); },
        assetPath: function(filename) { return new Handlebars.SafeString(assetHelpers.assetPath(filename)); },
        jsonStringify: function(obj) { return new Handlebars.SafeString(JSON.stringify(obj)); },
        publicPath: function(filename) { return new Handlebars.SafeString(assetHelpers.baseURL + "/public/" + filename)}
  };
}