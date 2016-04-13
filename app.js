var express = require('express');
var fs = require('fs');
var userController = require('./controllers/user');
var app = express();

app.use(express.static('public'));
app.use('/archives', express.static('account-medias/archive'));

app.post('/api/checkUsername/:username', userController.checkUsername);
app.post('/api/prepareMedias/:username', userController.prepareMedias);

app.listen(process.env.PORT | 8282, function () {
    console.log('Example app listening on port ' + (process.env.PORT | 8282));
});

module.exports.getApp = app;