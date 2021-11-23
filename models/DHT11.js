const mongoose = require('mongoose');
const DHT11Schema = mongoose.Schema({
  tmp: {
    type: String,
    required: true,
  },
  hum: {
    type: String,
    required: true,
  },
  created_ad: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DHT11', DHT11Schema)
