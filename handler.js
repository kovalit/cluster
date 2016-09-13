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
    
        id: null,
        generatorId: null,
    
        /**
         * Устанавливает идентификатор обработчика 
         * 
         * @param {String} id
         */
        setId: function(id) {
            this.id = id;
        },
        
        /**
         * Устанавливает идентификатор генератора
         * 
         * @param {String} id
         */
        setGeneratorId: function(id) {
            this.generatorId = id;
        },

        /**
         * Публикует событие добавления нового обработчика сообщений
         */
        add: function() {
            if (this.id !== this.generatorId) {
                 publisher.publish('ADD:HANDLER', this.id); 
            }  
        },
        
        /**
         * Публикует событие удаления обработчика сообщений
         */
        remove: function() { 
            
            if (this.id !== this.generatorId) {
                subscriber.unsubscribe();
                publisher.publish('REMOVE:HANDLER', this.id); 
            }

        },

        subscribe: function() {

            if (this.id === this.generatorId) {
                return;
            }

            subscriber.subscribe(this.id + ':MESSAGE');

            subscriber.on("message", function(channel, message) {  
                
                if (channel === this.id + ':MESSAGE') {
                    log.info('Get a message:', message, 'to', channel);
                }   
                
            }.bind(this));

        } 
        
    };
};