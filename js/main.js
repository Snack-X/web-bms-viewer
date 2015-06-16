function onFileSelect(e) {
  readFile(e.target.files[0]);
}

function readFile(file) {
  var reader = new FileReader();

  reader.onload = function(e) {
    getBmsChart(e.target.result);
  };

  reader.readAsText(file);
}

function getBmsChart(content) {
  var chart = bmsjs.Compiler.compile(content);
  
  renderBms(chart.chart);
}

function printBms(bars) {
  var start = 0;
  var output = "";
  var buffer = "";

  var columns = Math.ceil(bars.length / 4);
  
  while(bars.length % 4 !== 0) {
    bars.push("<div class='beat empty' style='height:192px'></div>");
  }

  for(var i = start ; i < bars.length ; i++) {
    buffer = bars[i] + buffer;

    if(i % 4 === 3) {
      output += "<div class='column'>" + buffer + "</div>";
      buffer = "";
    }
  }

  document.querySelector(".output").innerHTML = output;

  var columns = Math.ceil(bars.length / 4);

  document.querySelector(".output").style.width = (columns * 150) + "px";
}

function renderBms(chart) {
  var timing = bmsjs.Timing.fromBMSChart(chart);
  var _notes = bmsjs.Notes.fromBMSChart(chart);
  var notes = _notes.all();

  var outputBar = [];

  function writeBar(barNum, output, beatCnt) {
    var outputBefore = "<div class='beat' style='height:{h}px'>";
    var outputAfter = "</div>";

    outputBar[barNum] = outputBefore.replace("{h}", beatCnt * 48) + output.join("") + outputAfter; 
  }

  // Main loop
  var bar = 0;
  var output = [];

  var beatStart = bar * 4;
  var beatEnd = (bar + 1) * 4;

  var xtMap = {
    "SC": [0, "r"],
    "1": [25, "w"],
    "2": [40, "b"],
    "3": [55, "w"],
    "4": [70, "b"],
    "5": [85, "w"],
    "6": [100, "b"],
    "7": [115, "w"],
  };
  var notePattern = "<div class='note note-{t}' style='margin-top:{y}px;margin-left:{x}px'></div>";

  for(var idx in notes) {
    var note = notes[idx];
    if(typeof note.column === "undefined") continue;

    if(note.beat / 4 >= bar) {
      while(note.beat / 4 >= bar) {
        writeBar(bar, output, 4);
        output = [];
        bar++;

        beatStart = (bar - 1) * 4;
        beatEnd = bar * 4;
      }
    }

    var relativeBeat = note.beat - beatStart;
    var x = xtMap[note.column.column][0];
    var y = (4 - relativeBeat) * 48 - 4;
    var t = xtMap[note.column.column][1];

    output.push(notePattern.replace("{x}", x).replace("{y}", y).replace("{t}", t));
  }

  writeBar(bar, output, 4);

  printBms(outputBar);
}

document.querySelector("input[type=file]").addEventListener("change", onFileSelect);
