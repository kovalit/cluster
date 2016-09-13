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

setClient(clientID);
setGenerator('client1');
subscribe();

handler.add();

// Switcher
if (handler.id !== handler.generatorId) {
    
      subscriber.subscribe('SET:GENERATOR');
      subscriber.subscribe(handler.id + ':SET:POOL');  

      subscriber.on("message", function(channel, message) {

        if (channel === 'SET:GENERATOR') {
            
            setGenerator(message);
            
            if (handler.id === message) {
                subscriber.unsubscribe();
                subscribe();
            }
            
            log.info('Swith generator to:', message);

        } else if (channel === handler.id + ':SET:POOL') {

            generator.restorePool(message);
            generator.send();

        }

     });
 }
 
 
function shutdown() {
    console.log('shutdown');
    handler.remove();
    generator.stop();
    
    process.exit(1);
}

function setClient(id) {
    generator.setClientId(id);
    handler.setId(id);
}


function setGenerator(id) {
    generator.setId(id);
    handler.setGeneratorId(id);
}

function subscribe() {
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
