var express = require('express');
var app = express();
var userController = require('./controllers/user');
app.use(express.static('public'));

app.get('/api/checkUsername/:username', userController.checkUsername);
app.get('/api/downloadMedias/:username', userController.downloadMedias);

app.listen(process.env.PORT, function () {
    console.log('Example app listening on port ' + process.env.PORT);
});
