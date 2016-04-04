var express = require('express');
var fs = require('fs');
var logger = require('log4js').getLogger('app.js');
var userController = require('./controllers/user');
var app = express();
var constants = require('./constants/constants');
var timeout = require('connect-timeout');
app.use(express.static('public'));
app.use('/archives', express.static('account-medias/archive'));
app.use(timeout('600s'));
app.post('/api/checkUsername/:username', userController.checkUsername);
app.post('/api/prepareMedias/:username', userController.prepareMedias);

app.listen(process.env.PORT | 8080, function () {
    console.log('Example app listening on port ' + process.env.PORT);
});

module.exports.getApp = app;