#!/usr/bin/env node
'use strict';

var logger = require('../src/logger');
var program = require('commander');
var assign = require('object-assign');
var pjson = require('../package.json');
var app = require('../index.js');

program.version(pjson.version)
  .usage('[options] <doxygen XML directory>')
  .option('-o, --output <file>', 'output file, must contain "%s" when using `groups` or `classes` (default: "api.md"/"api_%s.md")', String)
  .option('-g, --groups', 'output doxygen groups into separate files', false)
  .option('-c, --classes', 'output doxygen classes into separate files', false)
  .option('-p, --pages', 'output doxygen pages into separate files', false)
  .option('-n, --noindex', 'disable generation of the index, ignored with `groups` or `classes`', false)
  .option('-a, --anchors', 'add anchors to internal links', false)
  .option('-H, --html-anchors', 'add html anchors to internal links', false)
  .option('-l, --language <lang>', 'programming language', String, 'cpp')
  .option('-t, --templates <dir>', 'custom templates directory (default: "built-in templates")', String)
  .option('-L, --logfile [file]', 'output log messages to file, (default: console only, default file name: "moxygen.log")')
  .option('-q, --quiet', 'quiet mode', false)
  .option('-r, --relative-paths', 'links are relative (don`t include the output path)', false)
  .option('-s, --separator <separator sequence>', 'separator sequence (default: "::")', '::')
  .option('-A, --access-level <public|protected|private>', 'minimum access level to be considered', 'private')

  .parse(process.argv);

  
  if (program.args.length) {
    const options = program.opts()    
    const finalOptions = assign({}, app.defaultOptions, {
    directory: program.args.slice(-1).pop(),
    output: options.output,
    groups: options.groups,
    pages: options.pages,
    classes: options.classes,
    noindex: options.noindex,
    anchors: options.anchors,
    htmlAnchors: options.htmlAnchors,
    language: options.language,
    relativePaths: options.relativePaths,
    separator: options.separator,
    templates: options.templates,
    accessLevel: options.accessLevel,
    quiet: options.quiet
  }); 
  logger.init(finalOptions, app.defaultOptions);
  app.run(finalOptions);
}
else {
  program.help();
}
