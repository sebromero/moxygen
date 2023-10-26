/**
 * Original work Copyright (c) 2016 Philippe FERDINAND
 * Modified work Copyright (c) 2016 Kam Low
 *
 * @license MIT
 **/
'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var log = require('./logger').getLogger();
var handlebars = require('handlebars');

module.exports = {

  inline (code) {
    if (Array.isArray(code)) {
      var refs, s = '', isInline = false;
      code.forEach(function (e) {
        refs = e.split(/(\[.*\]\(.*\)|\n|\s{2}\n)/g);
        refs.forEach(function (f) {
          if (f.charAt(0) == '[') {
            // link
            var link = f.match(/\[(.*)\]\((.*)\)/);
            if (link) {
              isInline ? (s += '`') && (isInline = false) : null;
              s += ' [`' + link[1] + '`](' + link[2] + ')';
            }
          }
          else if (f == '\n' || f == '  \n') {
            // line break
            isInline ? (s += '`') && (isInline = false) : null;
            s += f;
          }
          else if (f) {
            !isInline ? (s += '`') && (isInline = true) : null;
            s += f;
          }
        });
      });
      return s + (isInline ? '`' : '');
    }
    else {
      return '`' + code + '`';
    }
  },

  getAnchor (name, options) {
    if (options.anchors) {
      return '{#' + name + '}';
    }
    else if (options.htmlAnchors) {
      return '<a id="' + name + '" class="anchor"></a>';
    }
    else {
      return '';
    }
  },

  findParent (compound, kinds) {
    while (compound) {
      if (kinds.includes(compound.kind))
        return compound;
      compound = compound.parent;
    }
  },

  // Replace ref links to point to correct output file if needed
  resolveRefs (content, compound, references, options, filepath) {
    return content.replace(/\{#ref ([^ ]+) #\}/g, function(_, refid) {
      var ref = references[refid]
      let destcompound
      var page = this.findParent(ref, ['page']);

      if (page) {
        if (page.refid !== compound.refid) {
          destcompound = page
        }
      } else if (options.groups) {
        if (!compound.groupid || compound.groupid !== ref.groupid) {
          destcompound = ref
        }
      } else if (options.classes) {
        const dest = this.findParent(ref, ['namespace', 'class', 'struct', 'interface'])
        if (dest && compound.refid !== dest.refid) {
          destcompound = dest
        }
      } else if (compound.kind == 'page'){
        destcompound = compound.parent
      }

      if (destcompound) {
        const destpath = this.compoundPath(destcompound, options)
        if(options.relativePaths) {
          const relative = path.relative(path.dirname(filepath), destpath)
          return `${relative}#${refid}`
        }
        return `${destpath}#${refid}`
      }
      return '#' + refid
    }.bind(this))
  },

  compoundPath (compound, options) {
    var target = options.output;
    if (compound.kind == 'page') {
      return path.dirname(options.output) + "/page-" + compound.name + ".md";
    } else if (options.groups) {
      return util.format(target, compound.groupname);
    } else if (options.classes) {
      return util.format(target, compound.name.replace(/\:\:/g, options.separator).replace(/\:/g, '-').replace('<', '(').replace('>', ')'));
    } else {
      return target;
    }
  },

  writeCompound (compound, contents, references, options) {
    var outputPath = this.compoundPath(compound, options);
    this.writeFile(outputPath, contents.map(function(content) {
      return this.resolveRefs(content, compound, references, options, outputPath);
    }.bind(this)))
  },

  // Write the output file
  writeFile (filepath, contents) {
    log.verbose('Writing: ' + filepath);
    var stream = fs.createWriteStream(filepath);
    stream.once('open', function(fd) {
      contents.forEach(function (content) {
        if (content)
          stream.write(content);
      });
      stream.end();
    });
  },
};
