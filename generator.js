"use strict";

var log = require('./log')(module);

module.exports = function (publisher, subscriber) {
    
    var _pool = [];
    
    return {
        
        clientId:  null,
        
        setClient: function(clientId) {
            this.clientId = clientId;
        },
        
        addPool: function(clientId) {
            _pool.push(clientId);
            if (_pool.length > 0) {
                this.send();
            }
            log.info('Connect a new handler:', clientId);
        },


        deletePool: function(clientId) {
            for (var i = _pool.length; i--;) {
                if(_pool[i] === clientId) {
                    _pool.splice(i, 1);
                }
            }
            log.info('Disconnect a handler:', clientId);
        },

        subscribe: function() {

            if (this.clientId !== 'client1') {
                return;
            }

            subscriber.subscribe('addClient');
            subscriber.subscribe('deleteClient');

            subscriber.on("message", function(channel, message) {
                if (channel === 'addClient') {
                    this.addPool(message);
                }
                if (channel === 'deleteClient') {
                    this.deletePool(message);
                }
            }.bind(this));
        },
        
        
        getMessage: function(){
            this.cnt = this.cnt || 0;
            return this.cnt++;
        },

        send: function() {
            if (this.clientId !== 'client1') {
                return;
            }
            setTimeout(function() {
                if (_pool.length > 0) {
                    var rand = Math.floor(Math.random() * _pool.length);
                    publisher.publish(_pool[rand], 'Hello');
                    log.info('Send message:', _pool[rand], 'Hello'); 
                    this.send();
                }
            }.bind(this), 2000);
        },
        
        dump: function() {
            if (this.clientId !== 'client1') {
                return;
            }
            subscriber.unsubscribe();
            for (var i = 0, length = _pool.length; i < length; i++) {
                subscriber.sadd('clients', _pool[i]);
            }
            publisher.publish('shutdownGenerator', 1); 
        }
    };  
};
