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
