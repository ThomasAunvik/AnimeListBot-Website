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

        var millis = Date.now() - start;
        console.log("/api/discord/users/@me Request Time: " + millis + "ms");

        start = Date.now();
        var { rows } = await db.query('SELECT * from discord_user WHERE user_id= $1', [json.id]);
        
        millis = Date.now() - start;
        console.log("/api/me Request Time: " + millis + "ms");

        var user = rows[0];
        if(!user){
            res.statusCode = 404;
            res.write("User does not exist in the database.");
            res.end();
            return;
        }

        if(!user.guilds){
            res.statusCode = 404;
            res.write("There are no servers that are registered.");
            res.end();
            return;
        }

        var server_id = req.baseUrl.replace("/api/server/", "");
        if(!user.servers.includes(server_id) && json.id != "96580514021912576"){
            res.statusCode = 401;
            res.write("Unauthorized, user is not in guild.");
            res.end();
            return;
        }
        
        var { rows } = await db.query('SELECT * from discord_server WHERE server_id= $1', [server_id]);
        res.write(JSON.stringify(rows[0]));
        res.end();
    }else{
        req.session.me = null;
        req.session.token = null;
        res.statusCode = 401;
        res.write("No Session Token, Try logging in.");
        res.end();
    }
})
