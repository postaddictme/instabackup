/**
 * Created by raiym on 2/12/16.
 */
var request = require('request');
var logger = require('log4js').getLogger('controllers/user.js');
var loki = require('lokijs');
var db = new loki('loki.json');

var InstagramPosts = require('instagram-screen-scrape');
var fs = require('fs');

var usernames = db.addCollection('usernames');


var archiver = require('archiver');
var AWS = require('aws-sdk');
AWS.config.region = 'eu-central-1';

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
        if (body.indexOf('"is_private":true') !== -1) {
            res.json({
                error: 1,
                message: 'Account is private.',
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

        // TODO: Send email to me
    });
};

module.exports.downloadMedias = function (req, res) {
    if (!req.params.hasOwnProperty('username')) {
        res.json({
            error: 1,
            message: 'Username parameter not found.',
            data: null
        });
        return;
    }
    var username = req.params.username;
    var account = usernames.find({username: username});
    var accounts = usernames.find({username: username});
    var currentTimestamp = Math.round((+new Date()) / 1000)
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
    // Download here

    fs.access('account-medias/raw/' + username, fs.R_OK, function (err) {
        if (err) {
            logger.error(err);
            fs.mkdir('account-medias/raw/' + username, downloadMedia(username, res));
            return;
        }
        downloadMedia(username, res);
    });


    // TODO: Send email to me
};

function downloadMedia(username, res) {
    var streamOfPosts = new InstagramPosts({
        username: username
    });
    var pathToFolder = 'account-medias/raw/' + username;
    var pathToZip = 'account-medias/archive/' + username + '.zip';

    streamOfPosts.on('readable', function () {
        var post, time;
        post = streamOfPosts.read();
        if (!post || post == null || typeof post == null || typeof  post == "undefined") {
            return;
        }
        time = new Date(post.time * 1000);
        //console.log([
        //    "slang800's post from ",
        //    time.toLocaleDateString(),
        //    " got ",
        //    post.like,
        //    " like(s), and ",
        //    post.comment,
        //    " comment(s)"
        //].join(''));
        console.log(post);
        //if (!fs.)
// bigphoto: JSON.stringify(rawPost.images.low_resolution.url).replace('320x320', '1080x1080')
        var photoUrl = post.bigphoto.replace('"', '').replace('"', '').split('?')[0];
        if (post.video) {
            download(post.video, pathToFolder + '/' + post.time + '.mp4', function () {
                //console.log('done');
            });
        } else {
            download(photoUrl, pathToFolder + '/' + post.time + '.jpg', function () {
                //console.log('done');
            });
        }
    });
    streamOfPosts.on('end', function () {
        logger.info('DOWNLOADED');
        //res.json('DOWNLOADED');
        var output = fs.createWriteStream(pathToZip);
        var archive = archiver.create('zip', {});
        output.on('close', function () {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');


            var resMessage;

            var stats = fs.statSync(pathToZip);
            var fileSizeInBytes = stats["size"];
            var fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
            logger.info(pathToZip + "mB:", fileSizeInMegabytes);

            var fileStream = fs.createReadStream(pathToZip);
            fileStream.on('error', function (err) {
                resMessage = 'Error creating file stream.';
                logger.error(resMessage, err);
                res.json({error: 1, message: resMessage, data: null});
            });
            fileStream.on('open', function () {
                var s3bucket = new AWS.S3({params: {Bucket: 'instabackup2'}});
                var params = {
                    Key: username + '.zip',
                    Body: fileStream,
                    ACL: 'public-read',
                    ContentType: 'application/octet-stream'
                };
                s3bucket.upload(params, function (err, data) {
                    if (err) {
                        resMessage = 'Error uploading data';
                        logger.error(resMessage, err);
                        res.json({error: 1, message: resMessage, data: null});
                        return;
                    }
                    resMessage = 'Successfully uploaded data to myBucket/myKey.';
                    logger.info(resMessage, data);
                    res.json({
                        error: 0,
                        message: resMessage,
                        data: {zipUrl: data.Location}
                    });
                });
            });
        });

        archive.on('error', function (err) {
            throw err;
        });

        archive.pipe(output);
        //archive.bulk([
        //    {expand: true, cwd: pathToFolder, src: ['**']/*, dest: 'source'*/}
        //]);
        archive.directory(pathToFolder, '', {name: pathToFolder});
        archive.finalize();


    });
};


var download = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        //console.log('content-type:', res.headers['content-type']);
        //console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};
