
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

