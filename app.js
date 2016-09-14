"use strict";

var log = require('./log')(module);

var clientID    = process.env.clientID;

if (!clientID) {
    log.error('Environment variable (clientID) is not set.');
    process.exit(1);
}

log.info('APP. Start client:', clientID);

var redis           = require('redis');

var subscriber      = redis.createClient();
var publisher       = redis.createClient();
var errorCollector  = redis.createClient();

var client;
var generator   = require('./generator')(publisher, subscriber);
var handler     = require('./handler')(publisher, subscriber, errorCollector);


var isGenerator;



function setClient(generatorId) {
    isGenerator = clientID === generatorId;
    
    if (isGenerator) {
        client = generator;
    }
    else {
        client = handler;
    }
    
    client.setId(clientID);
    client.unsubscribe();
    client.subscribe();
}

setClient('client1');

client.add();


// Switcher
if (!isGenerator) {
    
    var setPoolChannel =  clientID + ':SET:POOL';
    
    subscriber.subscribe('SET:GENERATOR');
    subscriber.subscribe(setPoolChannel);  

    subscriber.on("message", function(channel, message) {

      if (channel === 'SET:GENERATOR') {
            if (message === clientID) {
                setClient(message);
            }

          log.info('APP: Swith generator to:', message);

      } else if (channel === setPoolChannel) {

          log.info('APP: Set pool:', message);

          generator.restorePool(message);
          generator.send();

      }

   });
 }
 
 
function shutdown() {
    client.close();
    process.exit(1);
}


process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', function(e){
    console.log('[uncaughtException] app will be terminated: ', e.stack);
    shutdown();
});

process.stdin.resume();
