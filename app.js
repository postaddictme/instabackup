var express = require('express');
var fs = require('fs');
var logger = require('log4js').getLogger('app.js');
var userController = require('./controllers/user');
var app = express();
var constants = require('./constants/constants');
var timeout = require('connect-timeout');
app.use(express.static('public'));
app.use('/archives', express.static('account-medias/archive'));
app.use(timeout('500s'));
// create folder if does not exist
fs.access(constants.FOLDER_ACCOUNT_MEDIAS, fs.R_OK | fs.W_OK, function (err) {
    if (err) {
        logger.warn('Seems that folder does not exist.');
        logger.debug('Creating folder', constants.FOLDER_ACCOUNT_MEDIAS);
        fs.mkdir(constants.FOLDER_ACCOUNT_MEDIAS, function (err) {
            if (err) {
                logger.error('Failed to create folder.', constants.FOLDER_ACCOUNT_MEDIAS);
                return;
            }
            logger.debug('Folder', constants.FOLDER_ACCOUNT_MEDIAS, 'created');
            createFolders();
        });
        return;
    }
    createFolders();
});

function createFolders() {
    fs.access(constants.FOLDER_ACCOUNT_RAW_MEDIAS, fs.R_OK | fs.W_OK, function (err) {
        if (err) {
            logger.warn(constants.FOLDER_ACCOUNT_RAW_MEDIAS, 'does not exist');
            logger.debug('Creating', constants.FOLDER_ACCOUNT_RAW_MEDIAS);
            fs.mkdir(constants.FOLDER_ACCOUNT_RAW_MEDIAS, function (err) {
                if (err) {
                    logger.error('An error occurred when trying to create ', constants.FOLDER_ACCOUNT_RAW_MEDIAS, err);
                    return;
                }
                logger.debug(constants.FOLDER_ACCOUNT_RAW_MEDIAS, 'folder created.');
            });
            return;
        }
        logger.debug(constants.FOLDER_ACCOUNT_RAW_MEDIAS, 'folder exists.');
    });

    fs.access(constants.FOLDER_ACCOUNT_ARCHIVE_MEDIAS, fs.R_OK | fs.W_OK, function (err) {
        if (err) {
            logger.warn(constants.FOLDER_ACCOUNT_ARCHIVE_MEDIAS, 'does not exist');
            logger.debug('Creating', constants.FOLDER_ACCOUNT_ARCHIVE_MEDIAS);
            fs.mkdir(constants.FOLDER_ACCOUNT_ARCHIVE_MEDIAS, function (err) {
                if (err) {
                    logger.error('An error occurred when trying to create ', constants.FOLDER_ACCOUNT_ARCHIVE_MEDIAS, err);
                    return;
                }
                logger.debug(constants.FOLDER_ACCOUNT_ARCHIVE_MEDIAS, 'folder created.');
            });
            return;
        }
        logger.debug(constants.FOLDER_ACCOUNT_ARCHIVE_MEDIAS, 'folder exists.');
    });
}

app.post('/api/checkUsername/:username', userController.checkUsername);
app.post('/api/prepareMedias/:username', userController.prepareMedias);

var server = app.listen(process.env.PORT, function () {
    console.log('Example app listening on port ' + process.env.PORT);
});