"use strict";

var log     = require('./log')(module);
var client  = require('./client')('HANDLER');

module.exports = function (publisher, subscriber, errorCollector) {
    
    var handler = Object.create(client);
    
    /**
     * Публикует событие добавления нового обработчика сообщений
     */
    handler.add = function() {
        publisher.publish('ADD:HANDLER', this.id);  
        log.info('HANDLER Added:', this.id);
    };
    
    /**
     * Публикует событие удаления обработчика сообщений
     */
    handler.close = function() { 
        subscriber.unsubscribe();
        publisher.publish('REMOVE:HANDLER', this.id); 

    };
    
    /**
     * Подписка на события от генератора
     */
    handler.subscribe = function() {

        var getMessageChannel = this.id + ':MESSAGE';

        subscriber.subscribe(getMessageChannel);

        subscriber.on("message", function(channel, message) {  

            if (channel === getMessageChannel) {

                this.read(message, this.save);

                log.info('HANDLER Get a message:', message, 'to', channel);

            }   

        }.bind(this));

    },
            
    /**
     * Отписка от событий
     */
    handler.unsubscribe = function() {
         subscriber.unsubscribe();
    }
    
  
    /**
     * Обработка сообщения (eventHandler)
     * 
     * @param {String} msg
     * @param {Function} callback
     */
    handler.read = function(msg, callback) {
        function onComplete(){
            var error = Math.random() > 0.85;
            callback(error, msg);
        }
        // processing takes time...
        setTimeout(onComplete, Math.floor(Math.random()*1000));
    },


    /**
     * Сохранение сообщения
     * 
     * @param {Boolean} error
     * @param {Function} msg
     */
    handler.save = function(error, msg) {
        errorCollector.sadd('errors', msg);
        //log.info('Error:', error, 'msg', msg);
    }; 
    
    
    return handler;
        
};