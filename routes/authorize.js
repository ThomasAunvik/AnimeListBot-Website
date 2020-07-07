/*
 * This file is part of AnimeList Bot Website
 *
 * AnimeList Bot Website is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AnimeList Bot Website is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AnimeList Bot Website.  If not, see <https://www.gnu.org/licenses/>
 */
var url = require('url');
var express = require('express');
var axios = require('axios');
const qs = require('qs');
var createError = require('http-errors');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  var config = req.config;
  var url_request = config.discord_api;

  const queryObject = url.parse(req.url,true).query;
  const requestData = {
    'client_id': req.config.client_id,
    'client_secret': req.config.client_secret,
    'grant_type': 'authorization_code',
    'code': queryObject.code,
    'redirect_uri': req.config.main + "/authorize",
    'scope': 'identify email connections guilds',
  }

  axios.post(url_request + '/oauth2/token', qs.stringify(requestData))
    .then(function(response){
      // CREATE SESSION
      req.session.token = response.data;
      res.redirect("/");
    }).catch(function(error){
      console.log(error);
      res.redirect("/");
    });
});

module.exports = router;
