/**
 * Module dependencies
 */

var isValid = require('valid-css-props');

/**
 * Expose `cssSWS` function.
 * @param {String} str
 * @param {Object} opts
 *
 * Options
 * - filename
 * - tabWidth  - default 2
 * - semiColon - default true
 */

module.exports = function cssSWS(str, opts) {
  opts = opts || {};
  var tab = opts.tabWidth || 2;
  var semi = opts.semiColon || true;
  var filename = opts.filename;

  var L = [0];
  var sto = [];

  var _ = str.split('\n');
  for (var i = 0, l = _.length; i < l; i++) {
    var spaces = spacing(_[i]);

    L[i-1] = L[i-1] || 0;
    L[i]   = L[i]   || L[i-1];

    // append previous line if indented
    if (L[i] < spaces) {
      while (sto.length) {
        var s = sto.pop();
        if (!s[1].replace(/[\{\}\s]/g, '').length) continue;
        _[s[0]] = s[1] + ',';
      }
      // only 2 spaces at a time
      if (spaces - L[i] > tab)
        throw Error('indentation over ' + tab +
                    ' spaces on line ' + i +
                    (filename ? ' in ' + filename : ''));
      _[i - 1] += ' {';
      L[i] = spaces;
    } else if (L[i] > spaces) {
      // we know `sto` is full of props,
      // so let's check them now
      parseProps.call(_, sto, semi);
      parseProp.call(_, i-1, _[i-1], semi)
      _[i] += close(L[i], tab);
      L[i] = spaces;
    } else {
      _[i-1]
        // don't sto whitespace
        && _[i-1].trim().length
        // push this item on the stack
        && sto.push([i-1, _[i-1]]);
    }

    // close last line if open
    if (i+1 === l && L[i] > 0) {
      _[i+1] = close(L[i], tab);
    } else {
    // or set next current level
      L[i+1] = L[i];
    }
  }

  return _.join('\n');
}

function parseProps(stored, semi) {
  while (stored.length) {
    var s = stored.pop();
    parseProp.call(this, s[0], s[1], semi);
  }
}

function parseProp(index, string, semi) {
  var parts = string.trim().split(' ');
  var head = parts.shift();
  if (!isValid(head)) return string;
  var space = string.split(head)[0];
  this[index] = space + head +
                (semi ? ': ' : '') +
                parts.join(' ').trim() + ';'
  return this[index];
}

function close(n, tab) {
  n = n / tab;
  var buf = '';
  while (n) buf += (blanks((tab * n--) - tab) + '}\n')
  return buf;
}

function blanks(len) {
  return '                  '.slice(0, len);
}

function spacing(str) {
  var m = /^( *)/.exec(str);
  return (m && m[0].length) || 0;
}
