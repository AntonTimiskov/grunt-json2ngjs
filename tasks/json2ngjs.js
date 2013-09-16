/*
 * grunt-json2ngjs
 */

'use strict';

module.exports = function(grunt) {

  var path = require('path');

  // convert Windows file separator URL path separator
  var normalizePath = function(p) {
    if ( path.sep !== '/' ) {
      p = p.replace(/\\/g, '/');
    }
    return p;
  };

  // Warn on and remove invalid source files (if nonull was set).
  var existsFilter = function(filepath) {

    if (!grunt.file.exists(filepath)) {
      grunt.log.warn('Source file "' + filepath + '" not found.');
      return false;
    } else {
      return true;
    }
  };

  // compile a template to an angular module
  var compileTemplate = function(moduleName, filepath, quoteChar, indentString) {

    var content = JSON.stringify(grunt.file.read(filepath));
    var doubleIndent = indentString + indentString;

    var module = 'angular.module(' + quoteChar + moduleName +
      quoteChar + ', []).run([' + quoteChar + '$templateCache' + quoteChar + ', function($templateCache) ' +
      '{\n' + indentString + '$templateCache.put(' + quoteChar + moduleName + quoteChar + ',\n' + doubleIndent  + quoteChar +  content +
       quoteChar + ');\n}]);\n';

    return module;
  };

  grunt.registerMultiTask('json2ngjs', 'Compiles json files to JavaScript.', function() {

    var options = this.options({
      base: 'src',
      module: 'json-' + this.target,
      quoteChar: '"',
      fileHeaderString: '',
      indentString: '  ',
      target: 'js'
    });

    // generate a separate module
    this.files.forEach(function(f) {

      // f.dest must be a string or write will fail

      var moduleNames = [];

      var modules = f.src.filter(existsFilter).map(function(filepath) {

        var moduleName = normalizePath(path.relative(options.base, filepath));
        if(grunt.util.kindOf(options.rename) === 'function') {
          moduleName = options.rename(moduleName);
        }
        moduleNames.push("'" + moduleName + "'");
        return compileTemplate(moduleName, filepath, options.quoteChar, options.indentString);

      }).join(grunt.util.normalizelf('\n'));

      var fileHeader = options.fileHeaderString !== '' ? options.fileHeaderString + '\n' : '';
      var bundle = "";
      var targetModule = f.module || options.module;
      //Allow a 'no targetModule if module is null' option
      if (targetModule) {
        bundle = "angular.module('" + targetModule + "', [" + moduleNames.join(', ') + "]);";
        bundle += "\n\n";
      }
      grunt.file.write(f.dest, fileHeader + bundle + modules);
    });
    //Just have one output, so if we making thirty files it only does one line
    grunt.log.writeln("Successfully converted "+(""+this.files.length).green +
                      " json files to " + options.target + ".");
  });
};
