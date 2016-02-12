/**
 * Created by raiym on 2/12/16.
 */
"use strict";
var request = require('request');
var logger = require('log4js').getLogger('models/user.js');

function UserException(message) {
    this.message = message;
    this.name = 'UserException';
}

module.exports = {
    checkAccount: function (username) {
        request('https://instagram.com/' + username + '/media', function (error, response, body) {
            if (error) {
                logger.error('An error occurred when trying to check username', username, error);
                throw new UserException('An error occurred when trying to check username');
            }
            if (body.indexOf('The link you followed may be broken, or the page may have been removed.') !== -1) {
                throw new UserException('Account with given username does not exist');
            }
            var jsonBody = JSON.parse(body);
            if (jsonBody.items.length === 0) {
                throw new UserException('Account is private or have not published any photo yet.');
            }
        });
    }
};