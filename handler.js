"use strict";

var log = require('./log')(module);
//function eventHandler(msg, callback){
//    function onComplete(){
//        var error = Math.random() > 0.85;
//        callback(error, msg);
//    }
//    // processing takes time...
//    setTimeout(onComplete, Math.floor(Math.random()*1000));
//}

module.exports = function (publisher, subscriber) {
    
    return {
    
        clientId: null,
        generatorId: null,
    
        setClient: function(id) {
            this.clientId = id;
        },
        
        setGenerator: function(id) {
            this.generatorId = id;
        },

        add: function() {
            if (this.clientId === this.generatorId) {
                return;
            }
            publisher.publish('ADD:HANDLER', this.clientId); 
        },

        removeClient: function() { 
            if (this.clientId === this.generatorId) {
                return;
            }
            subscriber.unsubscribe();
            publisher.publish('REMOVE:HANDLER', this.clientId); 
        },

        subscribe: function() {

            if (this.clientId === this.generatorId) {
                return;
            }

            subscriber.subscribe(this.clientId + ':MESSAGE');

            subscriber.on("message", function(channel, message) {  
                
                if (channel === this.clientId + ':MESSAGE') {
                    log.info('Get a message:', message, 'to', channel);
                }   
                
            }.bind(this));

        } 
    }
}



