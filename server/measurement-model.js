var mongoose = require('./database').mongoose;
var Schema = mongoose.Schema;
var Q = require('q');
var _ = require('lodash');
var MeasureSchema = new Schema({
    'count': String,
    'temp': String,
    'color': String,
    'light': String,
    'motion': String,
    'press': Number,
    'heading': Number,
    'time': Number
});
var MeasureModel = mongoose.model('WeatherData', MeasureSchema);
var MeasureModelTemporary = mongoose.model('temporary', MeasureSchema);



exports.insert = function (sensor) {
  var deferred = Q.defer();
  new MeasureModel(sensor).save(function (err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(sensor);
    }
  });
  return deferred.promise;
};

exports.insertTmp = function (sensor) {
  var deferred = Q.defer();
  new MeasureModelTemporary(sensor).save(function (err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(sensor);
    }
  });
  return deferred.promise;
};


exports.findAllLastHour = function (limit) {
  var deferred = Q.defer();
  MeasureModelTemporary.find({
    timestamp: {
      "$gte": new Date().getTime() - 3600000
    }
  }).sort("-timestamp").limit(limit || 5*60).exec(function (err, sensors) {
    if (err) {
      deferred.reject(err);
    } else {
      var resultFiltered = sensors.reduce(function (acc, i) {
        if (acc[makeType(i)]) {
          acc[makeType(i)].push(i);
        } else {
          acc[makeType(i)] = [i];
        }
        return acc;
      }, {});
      deferred.resolve(resultFiltered);
    }
  });
  return deferred.promise;
};

function makeType(sensor) {
  return sensor.type + '_' + sensor.sensor_type;
}

exports.clearTmp = function () {
  var deferred = Q.defer();
  MeasureModelTemporary.remove({
    timestamp: {
      "$lt": new Date().getTime() - 3600000
    }
  }).exec(function (err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result);
    }
  });
  return deferred.promise;
};

exports.findDayData = function (timestamp) {
  var begin = new Date(timestamp);
  begin.setHours(0);
  begin.setMinutes(0);
  begin.setSeconds(0);
  var end = new Date(timestamp);
  end.setHours(23);
  end.setMinutes(59);
  end.setSeconds(59);
  var deferred = Q.defer();
  console.log(begin, end);
  MeasureModel.find({
    query: {
      timestamp: {
        $gte: begin.getTime(),
        $lt: end.getTime()
      }
    }
  }).exec(function (err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      console.log("findDayData", result.length);
      var resultFiltered = result.reduce(function (acc, i) {
        var hour = new Date(i.timestamp).getHours();
        if (acc[makeType(i)]) {
          if(acc[makeType(i)][hour]) {
            acc[makeType(i)][hour].push(i);
          } else {
            acc[makeType(i)][hour] = [i];
          }
        } else {
          acc[makeType(i)] = {};
          acc[makeType(i)][hour] = [i];
        }
        return acc;
      }, {});

      var res = _.mapValues(resultFiltered, function (type) {
        return _.mapValues(type, function (sensorsByType) {
          var length = sensorsByType.length;
          var total = _.reduce(sensorsByType, function (acc, sensor) {
            acc.total += sensor.value;
            acc.value = acc.total / length;
            acc.type = sensor.type;
            acc.unit = sensor.unit;
            acc.unit_display = sensor.unit_display;
            acc.timestamp = sensor.timestamp;
            acc.sensor_type = sensor.sensor_type;
            acc.sensor_name = sensor.sensor_name;
            acc.date = sensor.date;
            return acc;
          }, { total: 0, value: 0} );
          return total;
        });
      });


      deferred.resolve(res);
    }
  });
  return deferred.promise;
};


exports.findAllLastDay = function () {
  var deferred = Q.defer();
  MeasureModel.find({
    query: {
      timestamp: {
        "$gte": new Date().getTime() - 3600000 * 24
      }
    }
  }).exec(function (err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      var resultFiltered = result.reduce(function (acc, i) {
        var hour = new Date(i.timestamp).getHours();
        if (acc[makeType(i)]) {
          if(acc[makeType(i)][hour]) {
            acc[makeType(i)][hour].push(i);
          } else {
            acc[makeType(i)][hour] = [i];
          }
        } else {
          acc[makeType(i)] = {};
          acc[makeType(i)][hour] = [i];
        }
        return acc;
      }, {});

      var res = _.mapValues(resultFiltered, function (type) {
        return _.mapValues(type, function (sensorsByType) {
          var length = sensorsByType.length;
          var total = _.reduce(sensorsByType, function (acc, sensor) {
            acc.total += sensor.value;
            acc.value = acc.total / length;
            acc.type = sensor.type;
            acc.unit = sensor.unit;
            acc.unit_display = sensor.unit_display;
            acc.timestamp = sensor.timestamp;
            acc.sensor_type = sensor.sensor_type;
            acc.sensor_name = sensor.sensor_name;
            acc.date = sensor.date;
            return acc;
          }, { total: 0, value: 0} );
          return total;
        });
      });


      deferred.resolve(res);
    }
  });
  return deferred.promise;
};



