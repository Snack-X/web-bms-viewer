// Replacement for lodash

module.exports = {
  values: function(obj) {
    return Object.keys(obj).map(function(k) { return obj[k]; });
  },
  uniq: function(array) {
    var lookup = {};
    var output = [];

    for(var i = 0 ; i < array.length ; i++) {
      if(typeof lookup[array[i]] === "undefined") {
        output.push(array[i]);
      }
    }

    return output;
  },
  pluck: function(objs, key) {
    var output = [];

    for(var i = 0 ; i < objs.length ; i++) {
      if(typeof objs[i][key] !== "undefined") {
        output.push(objs[i][key]);
      }
    }

    return output;
  }
};
