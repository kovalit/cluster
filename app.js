"use strict";

var log = require('./log')(module);

var clientID    = process.env.clientID;

if (!clientID) {
    log.error('Environment variable (clientID) is not set.');
    process.exit(1);
}

log.info('Start client:', clientID);

//
var redis       = require('redis');
//
var subscriber  = redis.createClient();
var publisher   = redis.createClient();




//subscriber.smembers("clients", function (err, replies) {
//    if(!err){
//        console.log(replies);
//    }
//});

var generator   = require('./generator')(publisher, subscriber);
var handler     = require('./handler')(publisher, subscriber);


generator.setClient(clientID);
generator.subscribe();

handler.setClient(clientID);
handler.subscribe();

function shutdown() {
    handler.removeClient();
    generator.dump();
    
    process.exit(1);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', function(e){
    console.log('[uncaughtException] app will be terminated: ', e.stack);
    shutdown();
});

process.stdin.resume();
