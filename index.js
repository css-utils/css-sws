/**
 * Module dependencies
 */

var isValidProp = require('valid-css-props');

/**
 * Expose `cssSWS` function.
 * @param {String} str
 * @param {Object} opts
 */

module.exports = function cssSWS(str, opts) {
  var parser = new Parser(str, opts);
  return parser.toString();
};

function Parser(str, opts) {
  this.str = str;
  this.lines = str.split('\n');
  this.opts = opts || {};
  this.tabSpacing = numToWs(this.opts.tabSize || 2);
}

Parser.prototype.toString = function() {
  this.cursor = 0;
  this.indent = 0;
  this.blocks = [];

  this.loop();

  var self = this;
  this.blocks.forEach(function(block) {
    self.append(-1, ' }');
  });

  return this.lines.join('\n');
};

Parser.prototype.loop = function() {
  var cursor = this.cursor;
  var line = this.lines[cursor];
  if (typeof line === 'undefined') return;

  if (isSignificant(line)) {
    this.handleProperty(line);
    this.handleIndent(line);
  }

  this.cursor++;
  this.loop();
};

Parser.prototype.handleProperty = function(line) {
  var parts = line.trim().split(/ +/);
  var prop = parts[0].replace(/\:$/, '');
  if (!this.isValidProp(prop)) return;

  if (parts[1].trim().charAt(0) === ':') parts[1] = '';

  var val = parts.slice(1).join(' ');

  if (!/\;$/.test(val.trim())) val += ';';

  this.replace(0, prop + ': ' + val);
};

Parser.prototype.handleIndent = function(line) {
  var indent = line === '' ? this.indent : this.countSpaces(line);

  if (this.indent < indent) this.beginBlock(indent);
  if (this.indent > indent) this.endBlock(indent);

  this.indent = indent;
};

Parser.prototype.beginBlock = function(indent) {
  this.append(-1, ' {');
  this.blocks.push(indent);
};

Parser.prototype.endBlock = function(indent) {
  var self = this;
  this.blocks = this.blocks.filter(function(block) {
    if (indent < block) self.append(-1, ' }');
    return indent >= block;
  });
};

Parser.prototype.replace = function(offset, content) {
  var pos = this.findSignificantLine(offset);
  var count = this.countSpaces(this.lines[pos]);
  this.lines[pos] = numToWs(count) + content;
};

Parser.prototype.append = function(offset, content) {
  var pos = this.findSignificantLine(offset);
  this.lines[pos] = this.lines[pos] + content;
};

Parser.prototype.prepend = function(offset, content) {
  var pos = this.findSignificantLine(offset);
  this.lines[pos] = content + this.lines[pos];
};

Parser.prototype.findSignificantLine = function(offset) {
  var cursor = this.cursor;
  var i = cursor + offset;
  var isPos = offset > 0;
  var lines = this.lines;
  if (isPos) {
    for (; i < lines.length; i++) {
      if (isSignificant(lines[i])) return i;
    }
  } else {
    for (; i > 0; i--) {
      if (isSignificant(lines[i])) return i;
    }
  }
  return i;
};

Parser.prototype.countSpaces = function(line) {
  line = line.replace(/\t/g, this.tabSpacing);
  return ((/^( *)/.exec(line) || [])[1] || '').length;
};

Parser.prototype.isValidProp = function(prop) {
  if (isValidProp(prop) || /^-(webkit|ms|moz|o|khtml|epub|internal)/.test(prop)) return true;
  // add any additional properties
  if (prop.indexOf('order') === 0) return true;
  if (prop.indexOf('filter') === 0) return true;
  if (prop.indexOf('align-') === 0) return true;
  if (prop.indexOf('justify-') === 0) return true;
  return false;
};

function numToWs(count) {
  var ws = '';
  for (var i = 0; i < count; i++) {
    ws += ' ';
  }
  return ws;
}

function isSignificant(line) {
  return !isComment(line) && !isBlank(line);
}

function isComment(line) {
  var str = line.trim();
  return /^\/\//.test(str) || /^\/\*/.test(str) || /^\*/.test(str);
}

function isBlank(line) {
  return !line.trim().length;
}
