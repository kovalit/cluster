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
    
        setClient: function(clientId) {
            this.clientId = clientId;
            this.add();
        },

        add: function() {
            if (this.clientId === 'client1') {
                return;
            }
            publisher.publish('addClient', this.clientId); 
        },

        removeClient: function() { 
            if (this.clientId === 'client1') {
                return;
            }
            subscriber.unsubscribe();
            publisher.publish('deleteClient', this.clientId); 
        },

        subscribe: function() {

            if (this.clientId === 'client1') {
                return;
            }

            subscriber.subscribe(this.clientId);
            subscriber.subscribe('shutdownGenerator');

            subscriber.on("message", function(channel, message) {
                log.info('Get a message:', message, 'from', channel);
            }.bind(this));

        } 
    }
}



