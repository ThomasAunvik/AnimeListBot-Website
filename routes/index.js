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
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.redirect && req.session.redirect != ""){
    var redirect = req.session.redirect;
    req.session.redirect = "";
    res.redirect(redirect);
    return;
  }
  res.render('index.html');
});

module.exports = router;
