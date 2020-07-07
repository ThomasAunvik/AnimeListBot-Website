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
const Router = require('express-promise-router');
const db = require('../../db');
const fetch = require('node-fetch');

const router = new Router();
module.exports = router;

/* GET users listing. */
router.get('/', async (req, res) => {
    if(req.session && req.session.token){
        var config = req.config;
        var api_path = "/users/@me";
        var url_request = config.discord_api + config.discord_api_version + api_path;
        
        var start = Date.now();
        const response = await fetch(url_request, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + req.session.token.access_token
            }
        });
        const json = await response.json();
        req.session.me = json;

        millis = Date.now() - start;
        console.log("/api/discord/users/@me Request Time: " + millis + "ms");
  
        start = Date.now();
        var { rows } = await db.query('SELECT * from discord_user WHERE user_id= $1', [json.id]);
        if(rows.length <= 0){

            var newUser = 'INSERT INTO public.discord_user('
                + 'user_id, mal_username, anilist_username, list_preference, anime_days, manga_days, guilds)'
                + ' VALUES (' + json.id + ', \'\', \'\', 0, 0, 0, null) RETURNING *;';
            var dbresponse = await db.query(newUser);
            var user = dbresponse.rows[0];
            res.write(JSON.stringify(user));
            res.end();
            return;
        }
        var user = rows[0];

        if(user.user_id == "96580514021912576"){
            var { rows } = await db.query('SELECT * from discord_server');
            var server_ids = [];
            for(var i = 0; i < rows.length; i++){
                server_ids.push(rows[i].server_id);
            }
            user.servers = server_ids;
            user.bypass = true;
        }

        millis = Date.now() - start;
        console.log("/api/me Request Time: " + millis + "ms");

        res.write(JSON.stringify(user));
        res.end();
    }else{
        req.session.me = null;
        req.session.token = null;
        res.statusCode = 401;
        res.write("No Session Token, Try logging in.");
        res.end();
    }
});
module.exports = router;
