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
const db = require('../db');

var fetch = require('node-fetch');

/* GET users listing. */
const router = new Router();
module.exports = router;

async function updateGuilds(guilds, me){
    var { rows } = await db.query('SELECT * from discord_user WHERE user_id= $1', [me.id]);
    var db_user = rows[0];

    var { rows } = await db.query('SELECT * from discord_server');
    var servers = rows;

    for(var user_index = 0; user_index < guilds.length; user_index++){
        var server = guilds[user_index];
        if(servers.find(x => x.id == server.id)){
            if(!db_user.servers.find(server.id)){
                db_user.servers.push(server.id);
            }
        }
    }

    var { rows } = await db.query('UPDATE discord_user SET servers = $1 WHERE user_id = $2', [db_user.servers, db_user.user_id])
}

router.get('/', async function(req, res, next) {
    if(req.session && req.session.token){
        var config = req.config;
        var api_path = req.baseUrl.replace("/api/discord", "");
        var url_request = config.discord_api + config.discord_api_version + api_path;
        
        var start = Date.now();
        const response = await fetch(url_request, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + req.session.token.access_token
            }
        })
        const json = await response.json();

        if(req.baseUrl == "/api/discord/users/@me"){
            req.session.me = json;
        }

        if(req.baseUrl == "/api/discord/users/@me/guilds"){
            await updateGuilds(json, req.session.me);
        }

        res.write(JSON.stringify(json));
        var millis = Date.now() - start;
        console.log(req.baseUrl + " Request Time: " + millis + "ms");
        res.end();
    }else{
        req.session.me = null;
        req.session.token = null;
        res.statusCode = 401;
        res.write("No Session Token, Try logging in.")
        res.end();
    }
});