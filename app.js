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
var fs = require('fs');
var uuid = require('uuid-random');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var pg = require('pg')
  , session = require('express-session')
  , pgSession = require('connect-pg-simple')(session);

var indexRouter = require('./routes/index');
var serverRouter = require('./routes/server');
var loginRouter = require('./routes/login');
var authorizeRouter = require('./routes/authorize');
var logoutRouter = require('./routes/logout');

var contactRouter = require('./routes/contact');
var commandsRouter = require('./routes/commands');

var discord_api_router = require('./routes/discord');

var dashboardRouter = require('./routes/dashboard');
var me_api = require('./routes/api/me');
var servers_api = require('./routes/api/me/servers');
var server_api = require('./routes/api/server');
var role_api = require('./routes/api/server/role');
var prefix_api = require('./routes/api/server/prefix');

var rawconfig = fs.readFileSync('config.json');
var config = JSON.parse(rawconfig);

var app = express();
app.engine('html', require('ejs').renderFile);

config.database.ssl = {
  rejectUnauthorized: false,
  ca: fs.readFileSync('ca-certificate.crt').toString()
}

var pgPool = new pg.Pool(config.database);

app.set('trust proxy', 1);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(session({
  genid: function(req){
    return uuid()
  },
  store: new pgSession({
    pool : pgPool,                // Connection pool
    tableName : 'session'   // Use another table-name than the default "session" one
  }),
  secret: config.secret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true, sameSite: "none"}
}));

app.use(function(req, res, next){
  req.config = config;
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/server', serverRouter);
app.use('/login', loginRouter);
app.use('/authorize', authorizeRouter);
app.use('/logout', logoutRouter);

app.use('/api/discord/*', discord_api_router);
app.use('/api/me', me_api);
app.use('/api/me/servers', servers_api)
app.use('/api/server/:id', server_api)
app.use('/api/server/:id/role', role_api)
app.use('/api/server/:id/prefix', prefix_api)

app.use('/dashboard/', dashboardRouter);
app.use('/dashboard/*', dashboardRouter);
app.use('/dashboard/server/', dashboardRouter);
app.use('/dashboard/server/*', dashboardRouter);
app.use('/dashboard/server/:id/', dashboardRouter);
app.use('/dashboard/server/:id/*', dashboardRouter);

app.use('/contact', contactRouter);
app.use('/commands', commandsRouter);

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error.html', {
    message: err.message,
    name: err.name,
    statuscode: err.status,
    stack: err.stack
  });
});

module.exports = app;
