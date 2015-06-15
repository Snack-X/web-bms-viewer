(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
var util = require('util'),
  Match = require ('../match');

/**
 * Binary search implementation (recursive)
 */
function binarySearch(arr, searchValue) {
  function find(arr, searchValue, left, right) {
    if (right < left)
      return -1;

    /*
    int mid = mid = (left + right) / 2;
    There is a bug in the above line;
    Joshua Bloch suggests the following replacement:
    */
    var mid = Math.floor((left + right) >>> 1);
    if (searchValue > arr[mid])
      return find(arr, searchValue, mid + 1, right);

    if (searchValue < arr[mid])
      return find(arr, searchValue, left, mid - 1);

    return mid;
  };

  return find(arr, searchValue, 0, arr.length - 1);
};

// 'Character'  iterated character class.
//    Recognizers for specific mbcs encodings make their 'characters' available
//    by providing a nextChar() function that fills in an instance of iteratedChar
//    with the next char from the input.
//    The returned characters are not converted to Unicode, but remain as the raw
//    bytes (concatenated into an int) from the codepage data.
//
//  For Asian charsets, use the raw input rather than the input that has been
//   stripped of markup.  Detection only considers multi-byte chars, effectively
//   stripping markup anyway, and double byte chars do occur in markup too.
//
function IteratedChar() {

  this.charValue = 0; // 1-4 bytes from the raw input data
  this.index     = 0;
  this.nextIndex = 0;
  this.error     = false;
  this.done      = false;

  this.reset = function() {
    this.charValue = 0;
    this.index     = -1;
    this.nextIndex = 0;
    this.error     = false;
    this.done      = false;
  };

  this.nextByte = function(det) {
    if (this.nextIndex >= det.fRawLength) {
      this.done = true;
      return -1;
    }
    var byteValue = det.fRawInput[this.nextIndex++] & 0x00ff;
    return byteValue;
  };
};



/**
 * Asian double or multi-byte - charsets.
 * Match is determined mostly by the input data adhering to the
 * encoding scheme for the charset, and, optionally,
 * frequency-of-occurence of characters.
 */

function mbcs() {};

/**
 * Test the match of this charset with the input text data
 *      which is obtained via the CharsetDetector object.
 *
 * @param det  The CharsetDetector, which contains the input text
 *             to be checked for being in this charset.
 * @return     Two values packed into one int  (Damn java, anyhow)
 *             bits 0-7:  the match confidence, ranging from 0-100
 *             bits 8-15: The match reason, an enum-like value.
 */
mbcs.prototype.match = function(det) {

  var singleByteCharCount = 0,  //TODO Do we really need this?
    doubleByteCharCount = 0,
    commonCharCount     = 0,
    badCharCount        = 0,
    totalCharCount      = 0,
    confidence          = 0;

  var iter = new IteratedChar();

  detectBlock: {
    for (iter.reset(); this.nextChar(iter, det);) {
      totalCharCount++;
      if (iter.error) {
        badCharCount++;
      } else {
        var cv = iter.charValue & 0xFFFFFFFF;

        if (cv <= 0xff) {
          singleByteCharCount++;
        } else {
          doubleByteCharCount++;
          if (this.commonChars != null) {
            // NOTE: This assumes that there are no 4-byte common chars.
            if (binarySearch(this.commonChars, cv) >= 0) {
              commonCharCount++;
            }
          }
        }
      }
      if (badCharCount >= 2 && badCharCount * 5 >= doubleByteCharCount) {
        // console.log('its here!')
        // Bail out early if the byte data is not matching the encoding scheme.
        break detectBlock;
      }
    }

    if (doubleByteCharCount <= 10 && badCharCount== 0) {
      // Not many multi-byte chars.
      if (doubleByteCharCount == 0 && totalCharCount < 10) {
        // There weren't any multibyte sequences, and there was a low density of non-ASCII single bytes.
        // We don't have enough data to have any confidence.
        // Statistical analysis of single byte non-ASCII charcters would probably help here.
        confidence = 0;
      }
      else {
        //   ASCII or ISO file?  It's probably not our encoding,
        //   but is not incompatible with our encoding, so don't give it a zero.
        confidence = 10;
      }
      break detectBlock;
    }

    //
    //  No match if there are too many characters that don't fit the encoding scheme.
    //    (should we have zero tolerance for these?)
    //
    if (doubleByteCharCount < 20 * badCharCount) {
      confidence = 0;
      break detectBlock;
    }

    if (this.commonChars == null) {
      // We have no statistics on frequently occuring characters.
      //  Assess confidence purely on having a reasonable number of
      //  multi-byte characters (the more the better
      confidence = 30 + doubleByteCharCount - 20 * badCharCount;
      if (confidence > 100) {
        confidence = 100;
      }
    } else {
      //
      // Frequency of occurence statistics exist.
      //
      var maxVal = Math.log(parseFloat(doubleByteCharCount) / 4);
      var scaleFactor = 90.0 / maxVal;
      confidence = Math.floor(Math.log(commonCharCount + 1) * scaleFactor + 10);
      confidence = Math.min(confidence, 100);
    }
  }   // end of detectBlock:

  return confidence == 0 ? null : new Match(det, this, confidence);
};

/**
 * Get the next character (however many bytes it is) from the input data
 *    Subclasses for specific charset encodings must implement this function
 *    to get characters according to the rules of their encoding scheme.
 *
 *  This function is not a method of class iteratedChar only because
 *   that would require a lot of extra derived classes, which is awkward.
 * @param it  The iteratedChar 'struct' into which the returned char is placed.
 * @param det The charset detector, which is needed to get at the input byte data
 *            being iterated over.
 * @return    True if a character was returned, false at end of input.
 */

mbcs.prototype.nextChar = function(iter, det) {};



/**
 * Shift-JIS charset recognizer.
 */
module.exports.sjis = function() {
  this.name = function() {
    return 'Shift-JIS';
  };
  this.language = function() {
    return 'ja';
  };

  // TODO:  This set of data comes from the character frequency-
  //        of-occurence analysis tool.  The data needs to be moved
  //        into a resource and loaded from there.
  this.commonChars = [
    0x8140, 0x8141, 0x8142, 0x8145, 0x815b, 0x8169, 0x816a, 0x8175, 0x8176, 0x82a0,
    0x82a2, 0x82a4, 0x82a9, 0x82aa, 0x82ab, 0x82ad, 0x82af, 0x82b1, 0x82b3, 0x82b5,
    0x82b7, 0x82bd, 0x82be, 0x82c1, 0x82c4, 0x82c5, 0x82c6, 0x82c8, 0x82c9, 0x82cc,
    0x82cd, 0x82dc, 0x82e0, 0x82e7, 0x82e8, 0x82e9, 0x82ea, 0x82f0, 0x82f1, 0x8341,
    0x8343, 0x834e, 0x834f, 0x8358, 0x835e, 0x8362, 0x8367, 0x8375, 0x8376, 0x8389,
    0x838a, 0x838b, 0x838d, 0x8393, 0x8e96, 0x93fa, 0x95aa
  ];

  this.nextChar = function(iter, det) {
    iter.index = iter.nextIndex;
    iter.error = false;

    var firstByte;
    firstByte = iter.charValue = iter.nextByte(det);
    if (firstByte < 0)
      return false;

    if (firstByte <= 0x7f || (firstByte > 0xa0 && firstByte <= 0xdf))
      return true;

    var secondByte = iter.nextByte(det);
    if (secondByte < 0)
      return false;

    iter.charValue = (firstByte << 8) | secondByte;
    if (! ((secondByte >= 0x40 && secondByte <= 0x7f) || (secondByte >= 0x80 && secondByte <= 0xff))) {
      // Illegal second byte value.
      iter.error = true;
    }
    return true;
  };
};
util.inherits(module.exports.sjis, mbcs);



/**
 *  EUC charset recognizers.  One abstract class that provides the common function
 *  for getting the next character according to the EUC encoding scheme,
 *  and nested derived classes for EUC_KR, EUC_JP, EUC_CN.
 *
 *  Get the next character value for EUC based encodings.
 *  Character 'value' is simply the raw bytes that make up the character
 *     packed into an int.
 */
function eucNextChar(iter, det) {
  iter.index = iter.nextIndex;
  iter.error = false;
  var firstByte  = 0;
  var secondByte = 0;
  var thirdByte  = 0;
  //int fourthByte = 0;
  buildChar: {
    firstByte = iter.charValue = iter.nextByte(det);
    if (firstByte < 0) {
      // Ran off the end of the input data
      iter.done = true;
      break buildChar;
    }
    if (firstByte <= 0x8d) {
      // single byte char
      break buildChar;
    }
    secondByte = iter.nextByte(det);
    iter.charValue = (iter.charValue << 8) | secondByte;
    if (firstByte >= 0xA1 && firstByte <= 0xfe) {
      // Two byte Char
      if (secondByte < 0xa1) {
        iter.error = true;
      }
      break buildChar;
    }
    if (firstByte == 0x8e) {
      // Code Set 2.
      //   In EUC-JP, total char size is 2 bytes, only one byte of actual char value.
      //   In EUC-TW, total char size is 4 bytes, three bytes contribute to char value.
      // We don't know which we've got.
      // Treat it like EUC-JP.  If the data really was EUC-TW, the following two
      //   bytes will look like a well formed 2 byte char.
      if (secondByte < 0xa1) {
        iter.error = true;
      }
      break buildChar;
    }
    if (firstByte == 0x8f) {
      // Code set 3.
      // Three byte total char size, two bytes of actual char value.
      thirdByte = iter.nextByte(det);
      iter.charValue = (iter.charValue << 8) | thirdByte;
      if (thirdByte < 0xa1) {
        iter.error = true;
      }
    }
  }
  return iter.done == false;
};



/**
 * The charset recognize for EUC-KR.  A singleton instance of this class
 *    is created and kept by the public CharsetDetector class
 */
module.exports.euc_kr = function() {
  this.name = function() {
    return 'EUC-KR';
  };
  this.language = function() {
    return 'ko';
  };

  // TODO:  This set of data comes from the character frequency-
  //        of-occurence analysis tool.  The data needs to be moved
  //        into a resource and loaded from there.
  this.commonChars = [
    0xb0a1, 0xb0b3, 0xb0c5, 0xb0cd, 0xb0d4, 0xb0e6, 0xb0ed, 0xb0f8, 0xb0fa, 0xb0fc,
    0xb1b8, 0xb1b9, 0xb1c7, 0xb1d7, 0xb1e2, 0xb3aa, 0xb3bb, 0xb4c2, 0xb4cf, 0xb4d9,
    0xb4eb, 0xb5a5, 0xb5b5, 0xb5bf, 0xb5c7, 0xb5e9, 0xb6f3, 0xb7af, 0xb7c2, 0xb7ce,
    0xb8a6, 0xb8ae, 0xb8b6, 0xb8b8, 0xb8bb, 0xb8e9, 0xb9ab, 0xb9ae, 0xb9cc, 0xb9ce,
    0xb9fd, 0xbab8, 0xbace, 0xbad0, 0xbaf1, 0xbbe7, 0xbbf3, 0xbbfd, 0xbcad, 0xbcba,
    0xbcd2, 0xbcf6, 0xbdba, 0xbdc0, 0xbdc3, 0xbdc5, 0xbec6, 0xbec8, 0xbedf, 0xbeee,
    0xbef8, 0xbefa, 0xbfa1, 0xbfa9, 0xbfc0, 0xbfe4, 0xbfeb, 0xbfec, 0xbff8, 0xc0a7,
    0xc0af, 0xc0b8, 0xc0ba, 0xc0bb, 0xc0bd, 0xc0c7, 0xc0cc, 0xc0ce, 0xc0cf, 0xc0d6,
    0xc0da, 0xc0e5, 0xc0fb, 0xc0fc, 0xc1a4, 0xc1a6, 0xc1b6, 0xc1d6, 0xc1df, 0xc1f6,
    0xc1f8, 0xc4a1, 0xc5cd, 0xc6ae, 0xc7cf, 0xc7d1, 0xc7d2, 0xc7d8, 0xc7e5, 0xc8ad
  ];

  this.nextChar = eucNextChar;
};
util.inherits(module.exports.euc_kr, mbcs);

},{"../match":9,"util":4}],6:[function(require,module,exports){
var util = require('util'),
  Match = require ('../match');

/**
 * This class matches UTF-16 and UTF-32, both big- and little-endian. The
 * BOM will be used if it is present.
 */
module.exports.UTF_16BE = function() {
  this.name = function() {
    return 'UTF-16BE';
  };
  this.match = function(det) {
    var input = det.fRawInput;

    if (input.length >= 2 && ((input[0] & 0xff) == 0xfe && (input[1] & 0xff) == 0xff))
      return new Match(det, this, confidence = 100);

    // TODO: Do some statistics to check for unsigned UTF-16BE
    return null;
  };
};

module.exports.UTF_16LE = function() {
  this.name = function() {
    return 'UTF-16LE';
  };
  this.match = function(det) {
    var input = det.fRawInput;

    if (input.length >= 2 && ((input[0] & 0xff) == 0xff && (input[1] & 0xff) == 0xfe)) {
       // An LE BOM is present.
       if (input.length >= 4 && input[2] == 0x00 && input[3] == 0x00)
         // It is probably UTF-32 LE, not UTF-16
         return null;

       return new Match(det, this, confidence = 100);
    }

    // TODO: Do some statistics to check for unsigned UTF-16LE
    return null;
  }
};

},{"../match":9,"util":4}],7:[function(require,module,exports){

var Match = require ('../match');

/**
 * Charset recognizer for UTF-8
 */
module.exports = function() {
  this.name = function() {
    return 'UTF-8';
  };
  this.match = function(det) {

    var hasBOM = false,
      numValid = 0,
      numInvalid = 0,
      input = det.fRawInput,
      trailBytes = 0,
      confidence;

    if (det.fRawLength >= 3 &&
      (input[0] & 0xff) == 0xef && (input[1] & 0xff) == 0xbb && (input[2] & 0xff) == 0xbf) {
      hasBOM = true;
    }

    // Scan for multi-byte sequences
    for (var i = 0; i < det.fRawLength; i++) {
      var b = input[i];
      if ((b & 0x80) == 0)
        continue; // ASCII

      // Hi bit on char found.  Figure out how long the sequence should be
      if ((b & 0x0e0) == 0x0c0) {
        trailBytes = 1;
      } else if ((b & 0x0f0) == 0x0e0) {
        trailBytes = 2;
      } else if ((b & 0x0f8) == 0xf0) {
        trailBytes = 3;
      } else {
        numInvalid++;
        if (numInvalid > 5)
          break;
        trailBytes = 0;
      }

      // Verify that we've got the right number of trail bytes in the sequence
      for (;;) {
        i++;
        if (i >= det.fRawLength)
          break;

        if ((input[i] & 0xc0) != 0x080) {
          numInvalid++;
          break;
        }
        if (--trailBytes == 0) {
          numValid++;
          break;
        }
      }
    }

    // Cook up some sort of confidence score, based on presense of a BOM
    //    and the existence of valid and/or invalid multi-byte sequences.
    confidence = 0;
    if (hasBOM && numInvalid == 0)
      confidence = 100;
    else if (hasBOM && numValid > numInvalid * 10)
      confidence = 80;
    else if (numValid > 3 && numInvalid == 0)
      confidence = 100;
    else if (numValid > 0 && numInvalid == 0)
      confidence = 80;
    else if (numValid == 0 && numInvalid == 0)
      // Plain ASCII.
      confidence = 10;
    else if (numValid > numInvalid * 10)
      // Probably corruput utf-8 data.  Valid sequences aren't likely by chance.
      confidence = 25;
    else
      return null

    return new Match(det, this, confidence);
  };
};

},{"../match":9}],8:[function(require,module,exports){

var utf8  = require('./encoding/utf8'),
  unicode = require('./encoding/unicode'),
  mbcs    = require('./encoding/mbcs');

var self = this;

var recognisers = [
  new utf8,
  new unicode.UTF_16BE,
  new unicode.UTF_16LE,
  new mbcs.sjis,
  new mbcs.euc_kr
];

window.chardet = {
  detect: function(buffer) {
    // Tally up the byte occurence statistics.
    var fByteStats = [];
    for (var i = 0; i < 256; i++)
      fByteStats[i] = 0;

    for (var i = buffer.length - 1; i >= 0; i--)
      fByteStats[buffer[i] & 0x00ff]++;

    var fC1Bytes = false;
    for (var i = 0x80; i <= 0x9F; i += 1) {
      if (fByteStats[i] != 0) {
        fC1Bytes = true;
        break;
      }
    }

    var context = {
      fByteStats:  fByteStats,
      fC1Bytes:    fC1Bytes,
      fRawInput:   buffer,
      fRawLength:  buffer.length,
      fInputBytes: buffer,
      fInputLen:   buffer.length
    };

    var match = recognisers.map(function(rec) {
      return rec.match(context);
    }).filter(function(match) {
      return !!match;
    }).sort(function(a, b) {
      return a.confidence - b.confidence;
    }).pop();

    return match ? match.name : null;
  }
};

},{"./encoding/mbcs":5,"./encoding/unicode":6,"./encoding/utf8":7}],9:[function(require,module,exports){

module.exports = function(det, rec, confidence, name, lang) {
  this.confidence = confidence;
  this.name = name || rec.name(det);
  this.lang = lang;
};

},{}]},{},[8]);
