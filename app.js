"use strict";

var log = require('./log')(module);

var clientID    = process.env.clientID;

if (!clientID) {
    log.error('Environment variable (clientID) is not set.');
    process.exit(1);
}

log.info('Start client:', clientID);

var redis       = require('redis');

var subscriber  = redis.createClient();
var publisher   = redis.createClient();

var generator   = require('./generator')(publisher, subscriber);
var handler     = require('./handler')(publisher, subscriber);

generator.setClient(clientID);
handler.setClient(clientID);

init('client1');

handler.add();

// Switcher
if (handler.clientId !== handler.generatorId) {
    
      subscriber.subscribe('SET:GENERATOR');
      subscriber.subscribe(handler.clientId + ':SET:POOL');  

      subscriber.on("message", function(channel, message) {

        if (channel === 'SET:GENERATOR') {

            handler.setGenerator(message);
            generator.setId(message);

            if (handler.clientId === message) {
                subscriber.unsubscribe();
            }
            
            generator.subscribe();
            handler.subscribe();
            
            log.info('Swith generator to:', message);

        } else if (channel === handler.clientId + ':SET:POOL') {

            generator.restorePool(message);
            generator.send();

        }

     });
 }
 
 
function shutdown() {
    handler.removeClient();
    generator.dump();
    
    process.exit(1);
}


function init(id) {
    generator.setId(id);
    handler.setGenerator(id);

    generator.subscribe();
    handler.subscribe();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', function(e){
    console.log('[uncaughtException] app will be terminated: ', e.stack);
    shutdown();
});

process.stdin.resume();
