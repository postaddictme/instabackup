/**
 * Created by raiym on 2/12/16.
 */
var request = require('request');
var logger = require('log4js').getLogger('controllers/user.js');
var loki = require('lokijs');
var constants = require('../constants/constants');
var db = new loki('loki.json');

var InstagramPosts = require('instagram-screen-scrape').InstagramPosts;
var fs = require('fs');
var usernames = db.addCollection('usernames');

var archiver = require('archiver');

module.exports.checkUsername = function (req, res) {
    if (!req.params.hasOwnProperty('username')) {
        res.json({
            error: 1,
            message: 'Username parameter not found.',
            data: null
        });
        return;
    }
    var username = req.params.username;
    request('https://instagram.com/' + username, function (error, response, body) {
        if (error) {
            logger.error('An error occurred when trying to check username', username, error);
            return;
        }
        if (body.indexOf('The link you followed may be broken, or the page may have been removed.') !== -1) {
            res.json({
                error: 1,
                message: 'Account with given username does not exist',
                data: null
            });
            return;
        }
        if (body.indexOf('"is_private": true') !== -1) {
            res.json({
                error: 1,
                message: 'Account is private. Service works only with public accounts',
                data: null
            });
            return;
        }
        var accountInfo = body.split('window._sharedData = ')[1].split(';</script>')[0];
        var accountInfoJson = JSON.parse(accountInfo);
        var account = accountInfoJson.entry_data.ProfilePage[0].user;
        res.json({
            error: 0,
            message: 'Account exists and has media. You can download your media free of charge.',
            data: accountInfoJson.entry_data.ProfilePage[0].user
        });
        usernames.insert({
            username: username,
            account: account,
            timestamp: Math.round((+new Date()) / 1000)
        });
    });
};

module.exports.prepareMedias = function (req, res) {
    if (!req.params.hasOwnProperty('username')) {
        res.json({
            error: 1,
            message: 'Username parameter not found.',
            data: null
        });
        return;
    }
    var username = req.params.username;
    var accounts = usernames.find({username: username});
    var currentTimestamp = Math.round((+new Date()) / 1000);
    if (accounts.length === 0) {
        res.json({
            error: 1,
            message: 'Account has not been checked yet. Please return to first page.',
            data: null
        });
        return;
    }
    logger.info('TIMEL: ' + currentTimestamp, accounts[0].timestamp);
    if (currentTimestamp - accounts[0].timestamp > 300) {
        res.json({
            error: 1,
            message: 'Account has been checked. But check expired. Please return to first page to check again.',
            data: null
        });
        return;
    }
    fs.access(constants.FOLDER_ACCOUNT_RAW_MEDIAS + '/' + username, fs.R_OK | fs.W_OK, function (err) {
        if (err) {
            logger.warn('Folder does not exist', constants.FOLDER_ACCOUNT_RAW_MEDIAS + '/' + username);
            logger.debug('Creating folder.');
            fs.mkdir(constants.FOLDER_ACCOUNT_RAW_MEDIAS + '/' + username, downloadMedia(username, res));
            return;
        }
        downloadMedia(username, res);
    });
};

function downloadMedia(username, res) {
    var streamOfPosts = new InstagramPosts({
        username: username
    });
    var pathToFolder = constants.FOLDER_ACCOUNT_RAW_MEDIAS + '/' + username;
    var pathToZip = 'account-medias/archive/' + username + '.zip';
    var index = 0;

    streamOfPosts.on('readable', function () {
        var post = streamOfPosts.read();
        if (!post || post == null || typeof  post == "undefined") {
            return;
        }
        // bigphoto: JSON.stringify(rawPost.images.low_resolution.url).replace('320x320', '1080x1080')
        //        var photoUrl = post.bigphoto.replace('"', '').replace('"', '').split('?')[0];
        if (post.type === 'video') {
            download(post.media, pathToFolder + '/' + post.time + '.mp4', function () {
                index++;
                logger.debug('Video downloaded:', index);
                var accounts = usernames.find({username: username});
                if (index === accounts[0].account.media.count) {
                    logger.debug('Starting zip');
                    zipIt(username, pathToFolder, res, pathToZip);
                }
            });
        } else if (post.type === 'image') {
            download(post.media, pathToFolder + '/' + post.time + '.jpg', function () {
                index++;
                logger.debug('Photo downloaded:', index);
                var accounts = usernames.find({username: username});
                if (index === accounts[0].account.media.count) {
                    logger.debug('Starting zip');
                    zipIt(username, pathToFolder, res, pathToZip);
                }
            });
        } else {
            logger.warn("Nor image nor video", post);
        }
    });
    streamOfPosts.on('end', function () {
        logger.debug('All info about post loaded.');
    });
}


var download = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        if (err) {
            logger.error('Error when downloading file', err);
        }
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

function zipIt(username, pathToFolder, res, pathToZip) {
    var output = fs.createWriteStream(pathToZip);
    var archive = archiver.create('zip', {});
    archive.directory(pathToFolder, '', {name: pathToFolder});

    archive.pipe(output);

    output.on('close', function () {
        console.log(archive.pointer() / (1024 * 1024) + ' total megabytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        var resMessage = 'hello';

        res.json({
            error: 0,
            message: resMessage,
            data: {zipUrl: 'archives/' + username + '.zip'}
        });
    });
    archive.on('error', function (err) {
        logger.error(err);
    });
    archive.finalize();
}