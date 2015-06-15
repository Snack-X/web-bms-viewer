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
