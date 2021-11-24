const express = require('express');
const app = express();
const path = require('path');
const mqtt = require('mqtt');
const http = require('http');
const mongoose = require('mongoose');

const DHT11 = require('./models/DHT11');
const devicesRouter = require('./routes/devices');
require('dotenv/config');

app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/devices', devicesRouter);

const client = mqtt.connect('mqtt://192.168.219.116');
client.on('connect', () => {
  console.log('mqtt connect');
  client.subscribe('dht11');
});

client.on('message', async (topic, message) => {
  const obj = JSON.parse(message);
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  obj.created_at = new Date(
    Date.UTC(year, month, today, hours, minutes, seconds)
  );
  console.log(obj);

  const dht11 = new DHT11({
    tmp: obj.tmp,
    hum: obj.hum,
    created_at: obj.created_at,
  });
  try {
    const saveDHT11 = await dht11.save();
    console.log('insert OK');
  } catch (err) {
    console.log({ message: err });
  }
});

app.set('port', '3000');
const server = http.createServer(app);
const io = require('socket.io')(server);
io.on('connection', (socket) => {
  //웹에서 소켓을 이용한 DHT11 센서데이터 모니터링
  socket.on('socket_evt_mqtt', function (data) {
    DHT11.find({})
      .sort({ _id: -1 })
      .limit(1)
      .then((data) => {
        //console.log(JSON.stringify(data[0]));
        socket.emit('socket_evt_mqtt', JSON.stringify(data[0]));
      });
  });
  //웹에서 소켓을 이용한 LED ON/OFF 제어
  socket.on('socket_evt_led', (data) => {
    const obj = JSON.parse(data);
    client.publish('led', obj.led + '');
  });
});
//웹서버 구동 및 DATABASE 구동
server.listen(3000, (err) => {
  if (err) {
    return console.log(err);
  } else {
    console.log('server ready');
    //Connection To DB
    mongoose.connect(
      process.env.MONGODB_URL,
      { useNewUrlParser: true, useUnifiedTopology: true },
      () => console.log('connected to DB!')
    );
  }
});
