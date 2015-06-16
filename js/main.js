function readFile(file) {
  var reader = new FileReader();

  reader.onload = function(e) {
    var chart = getChart(e.target.result);
    renderBms(chart);
  };

  reader.readAsText(file);
}

function getChart(str) {
  var chart = bmsjs.Compiler.compile(str)
  return chart.chart;
} 

function renderBms(chart) {
  var timing = bmsjs.Timing.fromBMSChart(chart);
  var _notes = bmsjs.Notes.fromBMSChart(chart);
  var notes = _notes.all();

  var outputBar = [];

  // Get bar length and BPM changes
  var barLength = [], barLengthSum = [], totalBeat = 0;
  var bpmChanges = {};

  // Bar length: Loop from 0 ~ last note's beat
  while(totalBeat <= notes[notes.length - 1].beat) {
    var beat = chart.timeSignatures.getBeats(barLength.length);
    barLength.push(beat);
    totalBeat += beat;
    barLengthSum.push(totalBeat);
  }

  console.log("Bar length", barLength);

  // BPM changes: get events and changes
  var events = timing.getEventBeats();
  for(var i in events) {
    var beat = events[i]
    bpmChanges[beat] = timing.bpmAtBeat(beat);
  }

  console.log("BPM changes", bpmChanges);
  // TODO: Display BPM changes

  // Split notes into bar
  var currentBar = 0;
  var barNotes = [], output = [];

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

  for(var idx in notes) {
    var note = notes[idx];

    if(note.beat >= barLengthSum[currentBar]) {
      while(note.beat >= barLengthSum[currentBar]) {
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
  }

  // Leftover
  barNotes[currentBar] = output;

  console.log("Notes per bar", barNotes);

  printBms(barLength, bpmChanges, barNotes);
}

function printBms(barLength, bpmChanges, barNotes) {
  var output = [];
  var buffer = [];

  var maxBeatInColumn = 16;
  var beatSum = 0;

  for(var bar = 0 ; bar < barNotes.length ; bar++) {
    var length = barLength[bar];
    var notes = barNotes[bar];

    if(beatSum + length > maxBeatInColumn) {
      var padHeight = 48 * (maxBeatInColumn - beatSum);
      buffer.unshift("<div class='bar empty' style='height:" + padHeight + "px'></div>");

      output.push("<div class='column'>" +
                  buffer.join("") +
                  "</div>");

      buffer = [];
      beatSum = 0;
    }

    beatSum += length;

    buffer.unshift("<div class='bar' style='height:" + length * 48 + "px'>" +
                     "<div class='bar-number'>" +
                       "<span style='margin-top:" + (length * 24 - 10) + "px'>" + bar + "</span>" +
                     "</div>" +
                     notes.join("") +
                   "</div>");
  }

  // Flush
  var padHeight = 48 * (maxBeatInColumn - beatSum);
  buffer.unshift("<div class='bar empty' style='height:" + padHeight + "px'></div>");

  output.push("<div class='column'>" +
              buffer.join("") +
              "</div>");


  // 185 = 10 + (35 + 130) + 10 (margin of column + width of beat)
  document.querySelector(".output").style.width = (output.length * 185) + "px";
  document.querySelector(".output").innerHTML = output.join("");

  document.querySelector(".before").style.display = "none";
  document.querySelector(".after").style.display = "block";
}

////////////////////////////////////////////////////////////////////////////////

var dropZone = document.querySelector(".drop-zone");
dropZone.addEventListener("dragover", function(e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
});

dropZone.addEventListener("drop", function(e) {
  e.stopPropagation();
  e.preventDefault();

  var file = e.dataTransfer.files[0];

  readFile(file);
});
