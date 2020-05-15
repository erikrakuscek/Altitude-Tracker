var express = require('express');
var mqtt = require('mqtt');
var router = express.Router();
var url = require('url');
var moment = require('moment');
const OpenWeatherMapHelper = require("openweathermap-node");
const helper = new OpenWeatherMapHelper(
  {
      APPID: '7acb743186c037efec372edf559ab390',
      units: "metric"
  }
);

var mqtt_url = process.env.CLOUDMQTT_URL || 'mqtt://bgntjbve:ePEQceGyUOu6@m24.cloudmqtt.com:12728';
var topic = process.env.CLOUDMQTT_TOPIC || '/data';
var client = mqtt.connect(mqtt_url);
var seaLevelPressure = 101325

/* GET home page. */
router.get('/', function(req, res, next) {
  var config =  url.parse(mqtt_url);
  config.topic = topic;
  res.render('index', {
    connected: client.connected,
    config: config
  });
});

client.on('connect', function() {
  router.post('/publish', function(req, res) {
	var msg = JSON.stringify({
	  date: new Date().toString(),
	  msg: req.body.msg
	});
    client.publish(topic, msg, function() {
      res.writeHead(204, { 'Connection': 'keep-alive' });
      res.end();
    });
  });

  router.get('/stream', function(req, res) {
    // send headers for event-stream connection
    // see spec for more information
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('\n');

    // Timeout timer, send a comment line every 20 sec
    var timer = setInterval(function() {
      res.write('event: ping' + '\n\n');
    }, 20000);

    client.subscribe(topic, function() {
      client.on('message', function(topic, msg, pkt) {
        const d = msg.toString().split(';');
        const temperature = d[0];
        const pressure = parseFloat(d[1]);
        helper.getCurrentWeatherByGeoCoordinates(46.267907, 13.594521, (err, currentWeather) => {
          if(err){
              console.log(err);
          }
          else{
              seaLevelPressure = currentWeather.main.pressure * 100
              console.log(seaLevelPressure);
              const altitude = ((1 - Math.pow(pressure / seaLevelPressure, 1 / 5.25588)) / 0.0000225577).toFixed(2);
              res.write("data: " + altitude + ": " + moment().format('HH:mm:ss') + "\n\n");      
          }
        });
      });
    });
  });
});


module.exports = router;
