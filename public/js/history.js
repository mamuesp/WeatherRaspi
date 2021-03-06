$(function () {
  $(document).ready(function () {
    var socket = window.io(document.location.host);
    socket.connect();

    var $graphs = $('#graphs-history');

    function makeChart(sensor, history) {
      var sensorType = makeSensorType(sensor);
      var graphId = 'graph-' + sensorType;
      var $graphContainer = $('<div class="graph" />');
      var $graph = $('<div id="' + graphId + '" style="width: 550px; height: 400px"/>');
      $graphContainer.append($graph);
      $graphs.append($graphContainer);
      var data = history.map(function (s) {
        return {
          x: s.timestamp,
          y: s.value
        };
      }).sort(function (a, b) {
        if (a.x < b.x) { return -1; }
        if (a.x > b.x) { return 1; }
        return 0;
      });
      var res = (data.length > numberTicks) ? data.slice(data.length - numberTicks, numberTicks) : data;
      return $('#' + graphId).highcharts({
          chart: {
              type: 'spline',
              animation: Highcharts.svg, // don't animate in old IE
              marginRight: 10
          },
          title: {
              text: sensor.type + " via " + sensor.sensor_type
          },
          xAxis: {
              type: 'datetime',
              tickPixelInterval: 60
          },
          yAxis: {
              title: {
                  text: sensor.unit
              },
              units: sensor.unit_display,
              plotLines: [{
                  value: 0,
                  width: 1,
                  color: '#808080'
              }]
          },
          tooltip: {
              formatter: function () {
                  return '<b>' + this.series.name + '</b><br/>' +
                      Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                      Highcharts.numberFormat(this.y, 2);
              }
          },
          legend: {
              enabled: false
          },
          exporting: {
              enabled: false
          },
          credits: {
              enabled: false
          },
          series: [{
              name: sensorType,
              data: res,
              color: highchartsColors[sensor.type]
          }]
      });
    }

    $('#dateHistory').val(moment().format('YYYY-MM-DD'));
    $('#dateHistoryLoad').on('click', function (e) {
      e.preventDefault();
      var date = $('#dateHistory').val();
      console.log("newDate", date);
      $graphs.empty();
      SensorsCharts = {};
      socket.emit('getHistoryLastDay', date);
      $('.loader').show();
    });

    socket.emit('getHistoryLastDay', new Date().getTime());

    socket.on('historyLastDay', function (history) {
      console.log("historyLastDay", history);
      for (var type in history) {
        var sensors = _.values(history[type]);
        console.log("sensors", sensors);
        if (!SensorsCharts[type]) {
          if (sensors.length > 0) {
            SensorsCharts[type] = makeChart(sensors[0], sensors);
          }
        }
      }

      $('.loader').hide();
    });
  });
});
