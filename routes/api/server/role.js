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
const db = require('../../../db');
const fetch = require('node-fetch');

const router = new Router();
module.exports = router;

const malRanks = {
    ANIME: 'Anime',
    MANGA: 'Manga',
    NOT_SET: 'Not Set'
}

/* POST users listing. */
router.post('/', async (req, res) => {
    if(req.session && req.session.token){
        var roleInfo = req.body;
        if(roleInfo.rankType == malRanks.NOT_SET) roleInfo.Days = 0;

        if(roleInfo.Days == null) roleInfo.Days = 0;
        roleInfo.Days = parseFloat(roleInfo.Days);
        if(roleInfo.Days == NaN){
            res.statusCode = 400;
            res.write("Bad Request: days is NaN");
            res.end();
            return;
        }

        if(roleInfo.Days < 0){
            res.statusCode = 400;
            res.write("Bad Request: days must be a positive number");
            res.end();
            return;
        }

        if(roleInfo.Days >= Number.MAX_SAFE_INTEGER) roleInfo.Days = Number.POSITIVE_INFINITY;

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

        var server_id = req.baseUrl.replace("/api/server/", "").replace("/role", "");
        var guild = user.guilds.find(x => x.server_id == server_id);
        if(guild == null && json.id != "96580514021912576"){
            res.statusCode = 401;
            res.write("Unauthorized, user is not in guild.");
            res.end();
            return;
        }

        if(guild.manageroles != true && json.id != "96580514021912576"){
            res.statusCode = 401;
            res.write("Unauthorized, user does not have ManageRoles permission.");
            res.end();
            return;
        }
        
        var { rows } = await db.query('SELECT * from discord_server WHERE server_id= $1', [server_id]);
        var server = rows[0];

        var animeIndex = server.server_ranks.AnimeRanks.findIndex(x => x.Id == roleInfo.Id);
        var mangaIndex = server.server_ranks.MangaRanks.findIndex(x => x.Id == roleInfo.Id);
        var notsetIndex = server.server_ranks.NotSetRanks.findIndex(x => x.Id == roleInfo.Id);

        if(animeIndex == -1 && mangaIndex == -1 && notsetIndex == -1){
            res.statusCode = 404;
            res.write("Role (" + roleInfo.Id + ") not found.");
            res.end();
            return;
        }

        var fromList;
        var toList;
        var justEdit = false;
        var roleIndex = -1;

        switch(roleInfo.rankType){
            case malRanks.ANIME:
                toList = server.server_ranks.AnimeRanks;
                if(animeIndex > -1) { justEdit = true; roleIndex = animeIndex; }
                else if(mangaIndex > -1) { fromList = server.server_ranks.MangaRanks; roleIndex = mangaIndex; }
                else if(notsetIndex > -1) { fromList = server.server_ranks.NotSetRanks; roleIndex = notsetIndex; }
                break;
            case malRanks.MANGA:
                toList = server.server_ranks.MangaRanks;
                if(mangaIndex > -1) { justEdit = true; roleIndex = mangaIndex; }
                else if(animeIndex > -1) { fromList = server.server_ranks.AnimeRanks; roleIndex = animeIndex; }
                else if(notsetIndex > -1) { fromList = server.server_ranks.NotSetRanks; roleIndex = notsetIndex; }
                break;
            case malRanks.NOT_SET:
                toList = server.server_ranks.NotSetRanks;
                if(notsetIndex > -1) { justEdit = true; roleIndex = notsetIndex; }
                else if(animeIndex > -1) { fromList = server.server_ranks.AnimeRanks; roleIndex = animeIndex; }
                else if(mangaIndex > -1) { fromList = server.server_ranks.MangaRanks; roleIndex = mangaIndex; }
                break;
        }

        var newRole;
        if(justEdit){
            toList[roleIndex].Days = roleInfo.Days;
            newRole = toList[roleIndex];
        }else{
            newRole = fromList[roleIndex];
            newRole.Days = roleInfo.Days;
            toList.push(newRole);
            fromList.splice(roleIndex, 1);
        }

        var { rows } = await db.query('UPDATE public.discord_server SET server_ranks= $1 WHERE server_id= $2 returning *;', [server.server_ranks, server_id]);

        res.write(JSON.stringify(rows[0]));
        res.end();
        return;
    }else{
        req.session.me = null;
        req.session.token = null;
        res.statusCode = 401;
        res.write("No Session Token, Try logging in.");
        res.end();
        return;
    }
})
