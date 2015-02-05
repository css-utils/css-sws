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

  function lookaheadIndent(i) {
    return spacing(nextPertinentString(_.slice(i + 1)));
  }

  function close(i) {
    var n = L[i] / tab;
    var buf = '';
    while (n) buf += (blanks((tab * n--) - tab) + '}\n')
    return buf;
  }

  // remove empty lines
  _ = _.filter(function(line) { return line.trim().length && line });

  for (var i = 0, l = _.length; i < l; i++) {
    // remove comments
    while (isComment(_[i])) _.splice(i, 1);

    var spaces = spacing(_[i]);
    var nextIndent = lookaheadIndent(i);
    var lineIsBlank = isBlank(_[i]);


    L[i-1] = L[i-1] || 0;
    L[i]   = L[i]   || L[i-1];

    // append previous line if indented
    if (L[i] < spaces) {
      while (sto.length) {
        var s = sto.pop();
        // ignore whitespace and brackets
        if (!s[1].replace(/[\{\}\s]/g, '').length) continue;
        // if item is a valid property, parse it
        // otherwise treat as if selector
        var prop = parseProp.call(_, s[1], _[s[0]], semi);
        _[s[0]] = prop.charAt(prop.length - 1) === ';'
          ? _[s[0]].replace(s[1], prop)
          : _[s[0]] = s[1] + (isAtRule(s[1]) ? ';' : ',');
      }
      // only 2 spaces at a time
      if (spaces - L[i] > tab) {
        throw Error('indentation over ' + tab +
                    ' spaces on line ' + i +
                    (filename ? ' in ' + filename : ''));
      }
      _[i - 1] += ' {';
      L[i] = spaces;
    } else if (L[i] > spaces) {
      // we know `sto` is full of props,
      // so let's check them now
      parseProps.call(_, sto, semi);
      parseProp.call(_, i-1, _[i-1], semi)
      // insert closing brackets and get
      // new array length
      _.splice(i, 0, close(i));
      l = _.length;

      var diff = spacing(nextPertinentString(_.slice(i + 1))) / tab;
      if (diff) {
        var bits = _[i].split('\n').slice(0, 0 - diff - 1);
        _[i] = bits.join('\n')
      }


      L[i] = spaces;
    } else {
      _[i-1]
        // don't sto whitespace
        && !lineIsBlank
        // push this item on the stack
        && sto.push([i-1, _[i-1]]);
    }


    // close last line if open
    if (i+1 === l && L[i] > 0) {
      _.splice(i + 1, 1, close(i));
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
  var value = parts.join(' ').trim();
  this[index] =
    space + head +
    (semi ? ': ' : '') +
    value + (value.charAt(value.length - 1) === ';' ? '' : ';')
  return this[index];
}

function blanks(len) {
  return '                  '.slice(0, len);
}

function spacing(str) {
  var m = /^( *)/.exec(str);
  return (m && m[0].length) || 0;
}

function nextPertinentString(arr) {
  var str = '';
  for (var i = 0, l = arr.length; i < l; i++) {
    var str = arr[i];
    if (isComment(str)) continue;
    if (isBlank(str)) continue;
    break;
  }
  return str;
}

function isBlank(str) {
  return !str.trim().length;
}

function isComment(str) {
  return /^\/\//.test(str.trim());
}

function isAtRule(str) {
  return str.charAt(0) === '@';
}
