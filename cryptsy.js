var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
var request = require('request');

/**
 * Cryptsy
 *
 * @param {string} key    API Key
 * @param {string} secret API Secret
 */
var Cryptsy = function(key, secret) {
    this.key = key;
    this.secret = secret;
    this.nonce = Math.floor((new Date()).getTime() / 1000);
    this.apiUrl = 'https://www.cryptsy.com/api';
    this.userAgent = 'Mozilla/4.0 (compatible; Cryptsy API Node.js client; NodeJS/' + process.version + ')';
};

/**
 * API call
 *
 * @param  {string}   method   API Method
 * @param  {object}   params   Method parameters
 * @param  {Function} callback (err, data)
 */
Cryptsy.prototype.api = function(method, params, callback) {
    params = params || {};
    params.method = method;
    params.nonce = ++this.nonce;
    this.postRequest(params, callback);
}

/**
 * Creates a Base64 signature of the request
 *
 * @param  {string} str Text string
 * @return {string}     Base64 encoded signature
 */
Cryptsy.prototype.getSignatureFromString = function(str) {
    var hmac = new crypto.createHmac('sha512', this.secret);
    hmac.update(str);
    return hmac.digest('hex');
}

/**
 * HTTP POST request
 *
 * @param  {String}   url      The URL to make the request
 * @param  {Object}   headers  Request headers
 * @param  {Object}   params   POST parameters
 * @param  {Function} callback (err, data)
 */
Cryptsy.prototype.postRequest = function(params, callback) {

    var options = {
        url: this.apiUrl,
        method: 'POST',
        form: params,
        headers: {
            'Sign': this.getSignatureFromString(querystring.stringify(params)),
            'Key': this.key,
            'User-Agent': this.userAgent,
        }
    };

    var req = request.post(options, function(err, response, body) {
        if (err) {
            callback(new Error('Error in server response: ' + JSON.stringify(err)), null);
        } else {
            if (typeof callback === 'function') {
                var data = null;
                var err = null;
                try {
                    data = JSON.parse(body);
                } catch(e) {
                    err = new Error('Error parsing JSON: ' + body);
                }
                if (err) {
                    callback(err, data);
                } else {
                    if (data && !!(data.success|0)) {
                        callback(err, data);
                    } else {
                        if (data && data.error) {
                            err = new Error(data.error);
                        } else {
                            err = new Error('Unknown error');
                        }
                        callback(err, null);
                    }
                }
            }
        }
    });
}

module.exports = Cryptsy;
