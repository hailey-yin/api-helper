var express = require('express');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require("./db/db");
var DeployHelper = require('./service/deployHelper');

var routes = require('./routes/index');
var api =  require('./routes/api');

var app = express();

//// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
/*app.set('view engine', 'ejs');*/
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'),{index:false}));

app.use(session({
    secret: 'budrest-session',
    name: 'budrest-session',
    cookie: {maxAge: 43200000 },
    saveUninitialized: false, // don't create session until something stored
    resave: false,//don't save session if unmodified
    unset:'destroy',//The session will be destroyed (deleted) when the response ends.
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

//to use session to views
app.use(function(req, res, next){
    res.locals.user = req.session.user;
    next();
});

app.use('/', routes);

//intercept the url that you want
app.use(function (req, res, next) {
    var url = req.originalUrl;
    if (((url.indexOf("/api/authority")== 0)||(url.indexOf("/api/projects")== 0)&&(req.method == 'POST'||req.method == 'PUT'||req.method == 'DELETE')) && !req.session.user) {
        return res.redirect("/");
    }
    next();
});

app.use('/api', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

DeployHelper.deployAll();
module.exports = app;
