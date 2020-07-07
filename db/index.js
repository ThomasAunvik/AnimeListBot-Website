const { Pool } = require('pg')
const fs = require('fs')

var rawconfig = fs.readFileSync('config.json');
var config = JSON.parse(rawconfig);

config.database.ssl = {
  rejectUnauthorized: false,
  ca: fs.readFileSync('ca-certificate.crt').toString()
}
const pool = new Pool(config.database)
module.exports = {
  query: (text, params) => pool.query(text, params),
}