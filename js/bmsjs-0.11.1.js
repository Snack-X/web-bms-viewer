(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * `BMSChart` holds information about a particular BMS notechart.
 *
 * @module bms/chart
 */

var BMSHeaders = require('./headers')
var BMSObjects = require('./objects')
var TimeSignatures = require('../time-signatures')

module.exports = BMSChart

/**
 * Generates an empty `BMSChart`.
 *
 * @class BMSChart
 * @constructor
 */
function BMSChart() {
  this.headers = new BMSHeaders()
  this.objects = new BMSObjects()
  this.timeSignatures = new TimeSignatures()
}

/**
 * Converts measure+fraction into beat.
 *
 * @method measureToBeat
 * @param {Number} measure   Measure number starting from 0
 * @param {Number} fraction  Fraction inside the measure (0 to 1)
 * @return {Number} The beat number starting from 0
 */
BMSChart.prototype.measureToBeat = function(measure, fraction) {
  return this.timeSignatures.measureToBeat(measure, fraction)
}


},{"../time-signatures":12,"./headers":2,"./objects":3}],2:[function(require,module,exports){

/**
 * @module bms/headers
 */
module.exports = BMSHeaders

/**
 * @class BMSHeaders
 * @constructor
 */
function BMSHeaders() {
  this._data = { }
  this._dataAll = { }
}

/**
 * Invokes a function at each header.
 *
 * @method each
 * @param  {Function} callback function to be invoked
 * @return {BMSHeaders} self
 */
BMSHeaders.prototype.each = function(callback) {
  for (var i in this._data) {
    callback(i, this._data[i])
  }
}

/**
 * Retrieves the header.
 *
 * @method get
 * @param  {String} name The header name (case-insensitive)
 * @return {String} The value of specified header
 */
BMSHeaders.prototype.get = function(name) {
  return this._data[name.toLowerCase()]
}

/**
 * Retrieves all headers (when header is specified multiple times).
 *
 * @method get
 * @param  {String} name The header name (case-insensitive)
 * @return {String[]} The values of specified header
 */
BMSHeaders.prototype.getAll = function(name) {
  return this._dataAll[name.toLowerCase()]
}

/**
 * Sets the header.
 *
 * @method set
 * @param  {String} name The header name (case-insensitive)
 * @param  {String} value The value to set
 */
BMSHeaders.prototype.set = function(name, value) {
  var key = name.toLowerCase()
  this._data[key] = value
  ;(this._dataAll[key] || (this._dataAll[key] = [])).push(value)
}


},{}],3:[function(require,module,exports){

/**
 * @module bms/objects
 */
module.exports = BMSObjects

/**
 * Holds a collection of objects inside a BMS notechart.
 *
 * @class BMSObjects
 * @constructor
 */
function BMSObjects() {
  this._objects = []
}

/**
 * Adds a new object to the collection. If an object already exists on the
 * same channel and position, the object is replaced (except for autokeysound
 * tracks).
 *
 * @method add
 * @param {BMSObject} object
 */
BMSObjects.prototype.add = function(object) {
  if (object.channel !== '01') {
    for (var i = 0; i < this._objects.length; i ++) {
      var test = this._objects[i]
      if (test.channel === object.channel &&
          test.measure === object.measure &&
          test.fraction === object.fraction) {
        this._objects[i] = object
        return
      }
    }
  }
  this._objects.push(object)
}

/**
 * Returns a list of all objects.
 *
 * @method all
 * @return {BMSObject[]}
 */
BMSObjects.prototype.all = function() {
  return this._objects.slice()
}

/**
 * Returns a sorted list of all objects.
 *
 * @method all
 * @return {BMSObject[]}
 */
BMSObjects.prototype.allSorted = function() {
  var list = this.all()
  list.sort(function(a, b) {
    return (a.measure + a.fraction) - (b.measure + b.fraction)
  })
  return list
}


/**
 * @class BMSObject
 */
/**
 * The raw two-character BMS channel of this object.
 *
 * @property channel
 * @type String
 */
/**
 * The measure number, starting at 0 (corresponds to `#000`)
 *
 * @property measure
 * @type Number
 */
/**
 * The fractional position inside the measure, ranging from 0 (inclusive)
 * to 1 (exclusive). 0 means that the object is at the start of the measure,
 * where 1 means that the object is at the end of the measure.
 *
 * @property fraction
 * @type Number
 */
/**
 * The raw value of the BMS object — a two-character string.
 *
 * @property value
 * @type String
 */

},{}],4:[function(require,module,exports){

var match = require('../util/match')
var BMSChart = require('../bms/chart')

exports.compile = function(text, options) {

  options = options || { }

  var chart = new BMSChart()

  var rng = options.rng || function(max) {
    return 1 + Math.floor(Math.random() * max)
  }

  var randomStack = []
  var skipStack = [false]

  var result = {
    headerSentences: 0,
    channelSentences: 0,
    controlSentences: 0,
    skippedSentences: 0,
    malformedSentences: 0,
    chart: chart,
    warnings: []
  }

  eachLine(text, function(text, lineNumber) {
    var flow = true
    if (text.charAt(0) !== '#') return
    match(text)
    .when(/^#RANDOM\s+(\d+)$/i, function(m) {
      result.controlSentences += 1
      randomStack.push(rng(+m[1]))
    })
    .when(/^#IF\s+(\d+)$/i, function(m) {
      result.controlSentences += 1
      skipStack.push(randomStack[randomStack.length - 1] !== +m[1])
    })
    .when(/^#ENDIF$/i, function(m) {
      result.controlSentences += 1
      skipStack.pop()
    })
    .else(function() {
      flow = false
    })
    if (flow) return
    var skipped = skipStack[skipStack.length - 1]
    match(text)
    .when(/^#(\d\d\d)02:(\S*)$/, function(m) {
      result.channelSentences += 1
      if (!skipped) chart.timeSignatures.set(+m[1], +m[2])
    })
    .when(/^#(\d\d\d)(\S\S):(\S*)$/, function(m) {
      result.channelSentences += 1
      if (!skipped) handleChannelSentence(+m[1], m[2], m[3], lineNumber)
    })
    .when(/^#(\w+)(?:\s+(\S.*))?$/, function(m) {
      result.headerSentences += 1
      if (!skipped) chart.headers.set(m[1], m[2])
    })
    .else(function() {
      warn(lineNumber, 'Invalid command')
    })
  })

  return result

  function handleChannelSentence(measure, channel, string, lineNumber) {
    var items = Math.floor(string.length / 2)
    if (items === 0) return
    for (var i = 0; i < items; i ++) {
      var value = string.substr(i * 2, 2)
      var fraction = i / items
      if (value === '00') continue
      chart.objects.add({
        measure: measure, 
        fraction: fraction,
        value: value,
        channel: channel,
        lineNumber: lineNumber,
      })
    }
  }

  function warn(lineNumber, message) {
    result.warnings.push({
      lineNumber: lineNumber,
      message: message,
    })
  }

}

function eachLine(text, callback) {
  text.split(/\r\n|\r|\n/)
      .map(function(line) { return line.trim() })
      .forEach(function(line, index) {
    callback(line, index + 1)
  })
}


},{"../bms/chart":1,"../util/match":14}],5:[function(require,module,exports){
(function() {
  var Compiler       = require("./compiler");
  var BMSChart       = require("./bms/chart");
  var BMSHeaders     = require("./bms/headers");
  var BMSObjects     = require("./bms/objects");
  var Speedcore      = require("./speedcore");
  var TimeSignatures = require("./time-signatures");
  var Notes          = require("./notes");
  var Timing         = require("./timing");
  var SongInfo       = require("./song-info");
  var Keysounds      = require("./keysounds");

  window.bmsjs = {
    Compiler:       Compiler,
    BMSChart:       BMSChart,
    BMSHeaders:     BMSHeaders,
    BMSObjects:     BMSObjects,
    Speedcore:      Speedcore,
    TimeSignatures: TimeSignatures,
    Notes:          Notes,
    Timing:         Timing,
    SongInfo:       SongInfo,
    Keysounds:      Keysounds,
  };
})();

},{"./bms/chart":1,"./bms/headers":2,"./bms/objects":3,"./compiler":4,"./keysounds":6,"./notes":7,"./song-info":9,"./speedcore":10,"./time-signatures":12,"./timing":13}],6:[function(require,module,exports){

function Keysounds(map) {
  this._map = map
}

Keysounds.prototype.get = function(id) {
  return this._map[id.toLowerCase()]
}

Keysounds.prototype.files = function() {
  return _.uniq(_.values(this._map))
}

Keysounds.prototype.all = function() {
  return this._map
}

Keysounds.fromBMSChart = function(chart) {
  var map = {}
  chart.headers.each(function(name, value) {
    var match = name.match(/^wav(\S\S)$/i)
    if (!match) return
    map[match[1].toLowerCase()] = value
  })
  return new Keysounds(map)
}

module.exports = Keysounds

},{}],7:[function(require,module,exports){

var Note = require('./note')

module.exports = Notes

var CHANNEL_MAPPING = {
  IIDX_P1: {
    '11': { column: '1'  },
    '12': { column: '2'  },
    '13': { column: '3'  },
    '14': { column: '4'  },
    '15': { column: '5'  },
    '18': { column: '6'  },
    '19': { column: '7'  },
    '16': { column: 'SC' },
  },
}

/**
 * The Notes class holds the Note objects in the game. A note object may or
 * may not be playable.
 *
 * @class Notes
 * @constructor
 */
function Notes(notes) {
  notes.forEach(Note.validate)
  this._notes = notes
}

/**
 * Returns the number of notes in this object.
 *
 * @method count
 * @return {Number}
 */
Notes.prototype.count = function() {
  return this._notes.length
}

/**
 * Returns an Array of all notes.
 *
 * @method all
 * @return {Note[]}
 */
Notes.prototype.all = function() {
  return this._notes.slice()
}

/**
 * Creates a Notes object from a BMSChart.
 *
 * @static
 * @method fromBMSChart
 * @param {BMSChart} chart    the chart to process
 * @param {Object}   options  the note options
 */
Notes.fromBMSChart = function(chart, options) {
  options = options || { }
  var builder = new BMSNoteBuilder(chart)
  return builder.build()
}

function BMSNoteBuilder(chart) {
  this._chart = chart
}

BMSNoteBuilder.prototype.build = function() {
  this._notes = []
  this._activeLN = { }
  this._lastNote = { }
  this._lnObj = (this._chart.headers.get('lnobj') || '').toLowerCase()
  this._channelMapping = CHANNEL_MAPPING.IIDX_P1
  this._objects = this._chart.objects.allSorted()
  this._objects.forEach(function(object) {
    this._handle(object)
  }.bind(this))
  return new Notes(this._notes)
}

BMSNoteBuilder.prototype._handle = function(object) {
  if (object.channel === '01') {
    this._handleNormalNote(object)
  } else {
    switch (object.channel.charAt(0)) {
    case '1': case '2':
      this._handleNormalNote(object)
      break
    case '5': case '6':
      this._handleLongNote(object)
      break
    }
  }
}

BMSNoteBuilder.prototype._handleNormalNote = function(object) {
  var channel = this._normalizeChannel(object.channel)
  var beat = this._getBeat(object)
  if (object.value.toLowerCase() === this._lnObj) {
    if (this._lastNote[channel]) {
      this._lastNote[channel].endBeat = beat
    }
  } else {
    var note = {
      beat: beat,
      endBeat: undefined,
      keysound: object.value,
      column: this._getColumn(channel),
    }
    this._lastNote[channel] = note
    this._notes.push(note)
  }
}

BMSNoteBuilder.prototype._handleLongNote = function(object) {
  var channel = this._normalizeChannel(object.channel)
  var beat = this._getBeat(object)
  if (this._activeLN[channel]) {
    var note = this._activeLN[channel]
    note.endBeat = beat
    this._notes.push(note)
    ;delete this._activeLN[channel]
  } else {
    this._activeLN[channel] = {
      beat: beat,
      keysound: object.value,
      column: this._getColumn(channel),
    }
  }
}

BMSNoteBuilder.prototype._getBeat = function(object) {
  return this._chart.measureToBeat(object.measure, object.fraction)
}

BMSNoteBuilder.prototype._getColumn = function(channel) {
  return this._channelMapping[channel]
}

BMSNoteBuilder.prototype._normalizeChannel = function(channel) {
  return channel.replace(/^5/, '1').replace(/^6/, '2')
}


},{"./note":8}],8:[function(require,module,exports){

var DataStructure = require('data-structure')

var Column = new DataStructure({
  column: String,
})

/**
 * @class Note
 */
module.exports = new DataStructure({

  /**
   * @property beat
   * @type Number
   */
  beat: Number,

  /**
   * @property endBeat
   * @type Number|undefined
   */
  endBeat: DataStructure.maybe(Number),

  /**
   * @property column
   * @type Column|undefined
   */
  column: DataStructure.maybe(Column),

  /**
   * @property keysound
   * @type String
   */
  keysound: String,

})

},{"data-structure":15}],9:[function(require,module,exports){

var match = require('../util/match')
module.exports = SongInfo

function SongInfo() {
  this.title      = 'NO TITLE'
  this.artist     = 'NO ARTIST'
  this.genre      = 'NO GENRE'
  this.subtitles  = []
  this.subartists = []
  this.difficulty = 0
  this.level      = 0
}

SongInfo.fromBMSChart = function(chart) {
  var info = new SongInfo()
  var title      = chart.headers.get('title')
  var artist     = chart.headers.get('artist')
  var genre      = chart.headers.get('genre')
  var difficulty = +chart.headers.get('difficulty')
  var level      = +chart.headers.get('playlevel')
  var subtitles  = chart.headers.getAll('subtitle')
  var subartists = chart.headers.getAll('subartist')
  if (typeof title === 'string' && !subtitles) {
    var extractSubtitle = function(m) {
      title = m[1]
      subtitles = [m[2]]
    }
    match(title)
    .when(/^(.*\S)\s*-(.+?)-$/,   extractSubtitle)
    .when(/^(.*\S)\s*～(.+?)～$/, extractSubtitle)
    .when(/^(.*\S)\s*\((.+?)\)$/, extractSubtitle)
    .when(/^(.*\S)\s*\[(.+?)\]$/, extractSubtitle)
    .when(/^(.*\S)\s*<(.+?)>$/,   extractSubtitle)
  }
  if (title)      info.title      = title
  if (artist)     info.artist     = artist
  if (genre)      info.genre      = genre
  if (subtitles)  info.subtitles  = subtitles
  if (subartists) info.subartists = subartists
  if (difficulty) info.difficulty = difficulty
  if (level)      info.level      = level
  return info
}


},{"../util/match":14}],10:[function(require,module,exports){

var Segment = require('./segment')

/**
 * Speedcore is a library to help compute the speed and position
 * of linear motion. A Speedcore is constructed from an array of Segments.
 *
 * @module speedcore
 */
module.exports = Speedcore

/**
 * Construct a new `Speedcore` from segments
 *
 * @class Speedcore
 * @constructor
 * @param {Segment[]} segments  An array of segments.
 */
function Speedcore(segments) {
  this._segments = segments.map(Segment)
}

var T = function(segment) { return segment.t }
var X = function(segment) { return segment.x }
Speedcore.prototype._reached = function(index, typeFn, position) {
  if (index >= this._segments.length) return false
  var segment = this._segments[index]
  var target  = typeFn(segment)
  return segment.inclusive ? position >= target : position > target
}

Speedcore.prototype._segmentAt = function(typeFn, position) {
  for (var i = 0; i < this._segments.length; i ++) {
    if (!this._reached(i + 1, typeFn, position)) return this._segments[i]
  }
}

Speedcore.prototype.segmentAtX = function(x) {
  return this._segmentAt(X, x)
}

Speedcore.prototype.segmentAtT = function(t) {
  return this._segmentAt(T, t)
}

Speedcore.prototype.t = function(x) {
  var segment = this.segmentAtX(x)
  return segment.t + (x - segment.x) / (segment.dx || 1)
}

Speedcore.prototype.x = function(t) {
  var segment = this.segmentAtT(t)
  return segment.x + (t - segment.t) * segment.dx
}


},{"./segment":11}],11:[function(require,module,exports){

var DataStructure = require('data-structure')

/**
 * @class Segment
 */
module.exports = new DataStructure({

  /**
   * @property t
   * @type Number
   */
  t: Number,

  /**
   * @property x
   * @type Number
   */
  x: Number,

  /**
   * @property dx
   * @type Number
   */
  dx: Number,

})


},{"data-structure":15}],12:[function(require,module,exports){

/**
 * @module time-signatures
 */
module.exports = TimeSignatures

/**
 * @class TimeSignatures
 * @constructor
 */
function TimeSignatures() {
  this._values = { }
}

/**
 * @method set
 * @param {Number} measure  The measure number
 * @param {Number} value    The time signature value. 1 represents 4/4, and
 *                          0.75 represents 3/4. You get the idea.
 */
TimeSignatures.prototype.set = function(measure, value) {
  this._values[measure] = value
}

/**
 * @method get
 * @param {Number} measure
 * @return {Number}
 */
TimeSignatures.prototype.get = function(measure) {
  return this._values[measure] || 1
}

/**
 * @method getBeats
 * @param {Number} measure
 * @return {Number}
 */
TimeSignatures.prototype.getBeats = function(measure) {
  return this.get(measure) * 4
}

/**
 * @method measureToBeat
 * @param {Number} measure
 * @param {Number} fraction
 */
TimeSignatures.prototype.measureToBeat = function(measure, fraction) {
  var sum = 0
  for (var i = 0; i < measure; i ++) sum += this.getBeats(i)
  return sum + this.getBeats(measure) * fraction
}


},{}],13:[function(require,module,exports){

// The Timing module converts between beats and seconds.
// They are created from a notechart.

var Speedcore = require('../speedcore')

/**
 * @module timing
 */
module.exports = Timing

var precedence = { bpm: 1, stop: 2 }

function Timing(initialBPM, actions) {
  var state = { bpm: initialBPM, beat: 0, seconds: 0 }
  var segments = [ ]
  segments.push({
    t: 0,
    x: 0,
    dx: state.bpm / 60,
    bpm: state.bpm,
    inclusive: true,
  })
  actions = actions.slice()
  actions.sort(function(a, b) {
    return a.beat - b.beat || precedence[a.type] - precedence[b.type]
  })
  actions.forEach(function(action) {
    var beat    = action.beat
    var seconds = state.seconds + (beat - state.beat) * 60 / state.bpm
    switch (action.type) {
    case 'bpm':
      state.bpm = action.bpm
      segments.push({
        t: seconds,
        x: beat,
        dx: state.bpm / 60,
        bpm: state.bpm,
        inclusive: true,
      })
      break
    case 'stop':
      segments.push({
        t: seconds,
        x: beat,
        dx: 0,
        bpm: state.bpm,
        inclusive: true,
      })
      seconds += (action.stopBeats || 0) * 60 / state.bpm
      segments.push({
        t: seconds,
        x: beat,
        dx: state.bpm / 60,
        bpm: state.bpm,
        inclusive: false,
      })
      break
    default:
      throw new Error("Unrecognized segment object!")
    }
    state.beat    = beat
    state.seconds = seconds
  })
  this._speedcore   = new Speedcore(segments)
  this._eventBeats  = _.uniq(_.pluck(actions, 'beat'), true)
}

Timing.prototype.beatToSeconds = function(beat) {
  return this._speedcore.t(beat)
}

Timing.prototype.secondsToBeat = function(seconds) {
  return this._speedcore.x(seconds)
}

Timing.prototype.bpmAtBeat = function(beat) {
  return this._speedcore.segmentAtX(beat).bpm
}

Timing.prototype.getEventBeats = function(beat) {
  return this._eventBeats
}

Timing.fromBMSChart = function(chart) {
  var actions = []
  chart.objects.all().forEach(function(object) {
    var bpm
    var beat = chart.measureToBeat(object.measure, object.fraction)
    if (object.channel === '03') {
      bpm = parseInt(object.value, 16)
      actions.push({ type: 'bpm', beat: beat, bpm: bpm })
    } else if (object.channel === '08') {
      bpm = +chart.headers.get('bpm' + object.value)
      if (!isNaN(bpm)) actions.push({ type: 'bpm', beat: beat, bpm: bpm })
    } else if (object.channel === '09') {
      var stopBeats = chart.headers.get('stop' + object.value) / 48
      actions.push({ type: 'stop', beat: beat, stopBeats: stopBeats })
    }
  })
  return new Timing(+chart.headers.get('bpm') || 60, actions)
}


},{"../speedcore":10}],14:[function(require,module,exports){

module.exports = match

function match(text) {
  var matched = false
  return {
    when: function(pattern, callback) {
      if (matched) return this
      var match = text.match(pattern)
      if (match) {
        matched = true
        callback(match)
      }
      return this
    },
    else: function(callback) {
      if (matched) return this
      callback()
    }
  }
}


},{}],15:[function(require,module,exports){

module.exports = DataStructure

function DataStructure() {

  var schemas = [].slice.call(arguments)

  function Constructor(object) {
    Constructor.validate(object)
    return object
  }

  Constructor.validate = function(object) {
    for (var i = 0; i < schemas.length; i ++) {
      validate(schemas[i], object)
    }
  }

  return Constructor

}

DataStructure.maybe = function maybe(schema) {
  function MaybeValidator(object) {
    MaybeValidator.validate(object)
    return object
  }
  MaybeValidator.validate = function(value) {
    if (value === null || value === undefined) return
    validate(schema, value)
  }
  return MaybeValidator
}

function validate(schema, value) {
  if (schema === Number) schema = 'number'
  if (schema === String) schema = 'string'
  if (typeof schema === 'string') {
    if (typeof value !== schema) throw new Error('should be a ' + schema)
  } else if (typeof schema === 'function') {
    if (typeof schema.validate === 'function') {
      schema.validate(value)
    } else if (!(value instanceof schema)) {
      throw new Error('should be an instance of ' + schema)
    }
  } else if (typeof schema === 'object') {
    if (!value) throw new Error('should be an object')
    validateObject(schema, value)
  } else {
    throw new Error('invalid schema')
  }
}

function validateObject(schema, object) {
  for (var prop in schema) {
    if (!(prop in object)) {
      throw new Error('missing property: "' + prop + '"')
    }
    try {
      validate(schema[prop], object[prop])
    } catch (e) {
      throw new Error('error in property "' + prop + '": ' + e.message)
    }
  }
}


},{}]},{},[5]);
