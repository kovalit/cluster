"use strict";



//var redis = require("redis")
//  , subscriber = redis.createClient()
//  , publisher  = redis.createClient();
//  
//
//subscriber.on("message", function(channel, message) {
//   console.log("Message '" + message + "' on channel '" + channel + "' arrived!");
//});



//subscriber.subscribe("test");
//publisher.publish("test", getRandomInt(1,10));



var clientID    = process.env.clientID;

var redis       = require('redis');

var subscriber  = redis.createClient();
var publisher   = redis.createClient();

var generator   = require('./generator')(publisher, subscriber);
var handler     = require('./handler')(publisher, subscriber);



generator.init(clientID);
generator.subscribe();


handler.init(clientID);
handler.subscribe();

generator.send();

//client.smembers("subscriberPool", function (err, replies) {
//    if(!err){
//        console.log(replies);
//    }
//});


//
//client.on("message", function(channel, message) {
// client.smembers("subscriberPool", function (err, replies) {
//    if(err){
//        console.log(err);
//    }
//});
//
//});




process.on('exit', function (){
    console.log('exit:', clientID);
});

process.on('SIGINT', function () {
    console.log('SIGINT:', clientID);
    handler.remove();
    
//    client.srem('subscriberPool', clientID, function(err, reply) {
//        if (err) console.log('err');  
//        else console.log('reply');  
//    });
    process.exit(2);
});
