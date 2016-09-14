"use strict";

var log     = require('./log')(module);
var redis   = require('redis');
var client  = redis.createClient();

module.exports = function() {

    log.info('ERROR collector');
    client.smembers("errors", function(err, replies){
        if (err) throw err;

        var keys = Object.keys(replies);

        keys.forEach(function(i) {
            log.info('ERROR', replies[i]);
            client.srem('errors', replies[i]);
        });

        process.exit(1);
    })
    
}
