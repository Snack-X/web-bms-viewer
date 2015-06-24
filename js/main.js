function readFile(file) {
  $(".before span")[0].innerHTML = "Reading...";

  var reader = new FileReader();

  reader.onload = function(e) {
    $(".before span")[0].innerHTML = "Converting......";

    // ArrayBuffer -> Uint8Array -> Buffer -> Encoding Convert -> String
    var bmsArrayBuffer = e.target.result;
    var bmsUintArray = new Uint8Array(bmsArrayBuffer);
    var bmsBuffer = new Buffer.Buffer(bmsUintArray);
    var encoding = chardet.detect(bmsBuffer);
    var bmsContent = iconv.decode(bmsBuffer, encoding);

    window.bmsContent = bmsContent;

    var chart = getChart(bmsContent);
    renderBms(chart);
  };

  reader.readAsArrayBuffer(file);
}

function getChart(str) {
  $(".before span")[0].innerHTML = "Parsing.........";

  var chart = bmsjs.Compiler.compile(str);
  window.bmsChart = chart.chart; // maybe use later
  return chart.chart;
} 

function renderBms(chart) {
  $(".before span")[0].innerHTML = "Rendering............";

  var timing = bmsjs.Timing.fromBMSChart(chart);
  var _notes = bmsjs.Notes.fromBMSChart(chart);
  var notes = _notes.all();

  var outputBar = [];

  // BMS info
  var songInfo = bmsjs.SongInfo.fromBMSChart(chart);
  var infoTitle = songInfo.title;
  var infoArtist = songInfo.artist;
  var infoGenre = songInfo.genre
  var startBpm = parseFloat(chart.headers.get("bpm"));
  var infoMinBpm = startBpm, infoMaxBpm = startBpm;

  // Get bar length and BPM changes
  var barLength = [], barLengthSum = [], totalBeat = 0;
  var bpmChanges = {}, bpmChangeKeys = [];

  // Bar length: Loop from 0 ~ last note's beat
  while(totalBeat <= notes[notes.length - 1].beat) {
    var beat = chart.timeSignatures.getBeats(barLength.length);
    barLength.push(beat);
    totalBeat += beat;
    barLengthSum.push(totalBeat);
  }

  console.log("Bar length", barLength);

  // BPM changes: get events and changes
  bpmChangeKeys = timing.getEventBeats();
  for(var i in bpmChangeKeys) {
    var beat = bpmChangeKeys[i];
    bpmChanges[beat] = timing.bpmAtBeat(beat);
  }

  if(bpmChangeKeys.length === 0) {
    bpmChangeKeys = [0];
    bpmChanges = { 0: startBpm };
  }

  // min, max BPM
  for(var i in bpmChangeKeys) {
    var bpm = bpmChanges[bpmChangeKeys[i]];
    if(infoMinBpm > bpm) infoMinBpm = bpm;
    if(infoMaxBpm < bpm) infoMaxBpm = bpm;
  }

  console.log("BPM changes", bpmChanges);

  // Split notes into bar
  var currentBar = 0;
  var bpmChangeIdx = 0, currentBpm = startBpm;
  var barNotes = [], output = [];
  var longBody = [], longEnd = [];

  var xtMap = {
    "SC": [  0, "r"],
    "1":  [ 25, "w"],
    "2":  [ 40, "b"],
    "3":  [ 55, "w"],
    "4":  [ 70, "b"],
    "5":  [ 85, "w"],
    "6":  [100, "b"],
    "7":  [115, "w"],
  };
  var notePattern = "<div class='note note-{t}' style='margin-top:{y}px;margin-left:{x}px'></div>";
  var longNotePattern = "<div class='note long note-{t}' style='margin-top:{y}px;margin-left:{x}px;height:{h}px'></div>";
  var bpmPattern = "<div class='bpm' style='margin-top:{y}px'><span>{v}</span></div>";

  function processBpmChange(startBeat, endBeat) {
    startBeat = startBeat || 0;
    var barLength = endBeat - startBeat;

    var changeBeat = bpmChangeKeys[bpmChangeIdx];
    var changeBpm = bpmChanges[bpmChangeKeys[bpmChangeIdx]];
    while(typeof changeBeat !== "undefined" &&
          changeBeat < endBeat) {
      if(currentBpm === changeBpm) {
        bpmChangeIdx++;
        changeBeat = bpmChangeKeys[bpmChangeIdx];
        changeBpm = bpmChanges[bpmChangeKeys[bpmChangeIdx]];

        continue;
      }
      currentBpm = changeBpm;

      var relativeBeat = changeBeat - startBeat;
      var y = (barLength - relativeBeat) * 48 - 12;

      output.push(bpmPattern.replace("{v}", changeBpm)
                            .replace("{y}", y));

      bpmChangeIdx++;
      changeBeat = bpmChangeKeys[bpmChangeIdx];
      changeBpm = bpmChanges[bpmChangeKeys[bpmChangeIdx]];
    }
  }

  function processLong(startBeat, endBeat) {
    var thisBarLength = endBeat - startBeat;

    for(var i in longBody) {
      var body = longBody[i];

      var y, h;
      var x = xtMap[body.column][0] + 35 + 2;
      var t = xtMap[body.column][1];

      // Started and ended at this bar
      if(
        body.start >= startBeat && body.start < endBeat &&
        body.end >= startBeat && body.end < endBeat
      ) {
        var endRelativeBeat = body.end - startBeat;
        y = (thisBarLength - endRelativeBeat) * 48;
        h = (body.end - body.start) * 48;

        longBody[i] = undefined;
      }
      // Started at this bar but not ended
      else if(
        body.start >= startBeat && body.start < endBeat &&
        body.end >= endBeat
      ) {
        y = 0;
        h = (endBeat - body.start) * 48;
      }
      // Started before and ended at this bar
      else if(
        body.start < startBeat &&
        body.end >= startBeat && body.end < endBeat
      ) {
        var endRelativeBeat = body.end - startBeat;
        y = (thisBarLength - endRelativeBeat) * 48;
        h = (body.end - startBeat) * 48;

        longBody[i] = undefined;
      }
      // Started before this bar and not ended
      else {
        y = 0;
        h = thisBarLength * 48;
      }

      output.push(longNotePattern.replace("{t}", t)
                                 .replace("{x}", x)
                                 .replace("{y}", y)
                                 .replace("{h}", h));
    }

    longBody = longBody.filter(function(b) { return !!b; });

    for(var i in longEnd) {
      var note = longEnd[i];

      if(note.beat >= startBeat && note.beat < endBeat) {
        var relativeBeat = note.beat - startBeat;
        var x = xtMap[note.column][0] + 35;
        var y = (thisBarLength - relativeBeat) * 48 - 4;
        var t = xtMap[note.column][1];

        output.push(notePattern.replace("{x}", x)
                               .replace("{y}", y)
                               .replace("{t}", t));
      }
    }
  }

  for(var idx in notes) {
    var note = notes[idx];

    if(note.beat >= barLengthSum[currentBar]) {
      while(note.beat >= barLengthSum[currentBar]) {
        var startBeat = barLengthSum[currentBar - 1];
        var endBeat = barLengthSum[currentBar];

        processBpmChange(startBeat, endBeat);
        processLong(startBeat, endBeat);

        barNotes[currentBar] = output;
        output = [];

        currentBar++;
      }
    }

    if(typeof note.column === "undefined") continue;

    var thisBarLength = barLength[currentBar];

    var relativeBeat = note.beat - barLengthSum[currentBar - 1];
    var x = xtMap[note.column.column][0] + 35;
    var y = (thisBarLength - relativeBeat) * 48 - 4;
    var t = xtMap[note.column.column][1];

    output.push(notePattern.replace("{x}", x)
                           .replace("{y}", y)
                           .replace("{t}", t));

    if(note.endBeat) {
      // Those are processed at bar change
      longBody.push({
        column: note.column.column,
        start: note.beat,
        end: note.endBeat
      });
      longEnd.push({
        column: note.column.column,
        beat: note.endBeat
      });
    }
  }

  // Leftover

  var startBeat = barLengthSum[currentBar - 1];
  var endBeat = barLengthSum[currentBar];
  var thisBarLength = endBeat - startBeat;
  processBpmChange(startBeat, endBeat);
  processLong(startBeat, endBeat);
  barNotes[currentBar] = output;

  console.log("Notes per bar", barNotes);

  // Print it
  var bmsInfo = {
    title: infoTitle,
    artist: infoArtist,
    genre: infoGenre,
    minBpm: infoMinBpm,
    maxBpm: infoMaxBpm
  };

  printBms(bmsInfo, barLength, bpmChanges, barNotes);
}

function printBms(info, barLength, bpmChanges, barNotes) {
  $(".before span")[0].innerHTML = "Printing...............";

  // Info first
  $(".after .info span")[0].innerHTML = "[" + info.genre + "] " + info.title
    + " - " + info.artist + "<br>"
    + "BPM : " + info.minBpm + " ~ " + info.maxBpm;

  // Notes
  var output = [];
  var outputBuffer = [];

  var maxBeatInColumn = 16;
  var beatSum = 0;

  for(var bar = 0 ; bar < barNotes.length ; bar++) {
    var length = barLength[bar];
    var notes = barNotes[bar];

    if(beatSum + length > maxBeatInColumn) {
      var padHeight = 48 * (maxBeatInColumn - beatSum);
      outputBuffer.unshift("<div class='bar empty' style='height:" + padHeight + "px'></div>");

      output.push("<div class='column'>" +
                  outputBuffer.join("") +
                  "</div>");

      outputBuffer = [];
      beatSum = 0;
    }

    beatSum += length;

    outputBuffer.unshift(
      "<div class='bar' style='height:" + length * 48 + "px'>" +
        "<div class='bar-number'>" +
          "<span style='margin-top:" + (length * 24 - 10) + "px'>" + bar + "</span>" +
        "</div>" +
        notes.join("") +
      "</div>");
  }

  // Flush
  var padHeight = 48 * (maxBeatInColumn - beatSum);
  outputBuffer.unshift("<div class='bar empty' style='height:" + padHeight + "px'></div>");

  output.push("<div class='column'>" +
              outputBuffer.join("") +
              "</div>");

  // 195 = 10 + (35 + 130) + 20 (margin of column + width of beat)
  $(".output")[0].style.width = (output.length * 195) + "px";
  $(".output")[0].innerHTML = output.join("");

  $(".before")[0].style.display = "none";
  $(".after")[0].style.display = "block";
}

////////////////////////////////////////////////////////////////////////////////

var dropZone = $(".drop-zone")[0];

dropZone.on("dragover", function(e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
});

dropZone.on("drop", function(e) {
  e.stopPropagation();
  e.preventDefault();

  var file = e.dataTransfer.files[0];

  readFile(file);
});
