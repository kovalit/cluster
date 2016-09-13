"use strict";

var clientID    = process.env.clientID;

var redis       = require('redis');

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


exitOnSignal('SIGINT');
exitOnSignal('SIGTERM');

function exitOnSignal(signal) {
    process.on(signal, function() {
        handler.removeClient();
        generator.dump();
        process.exit(1);
    });
}
