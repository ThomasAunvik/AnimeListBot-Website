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
  res.redirect(req.config.oauth);
});

module.exports = router;
