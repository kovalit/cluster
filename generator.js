"use strict";

var log     = require('./log')(module);
var client  = require('./client')('GENERATOR');

module.exports = function (publisher, subscriber) {
    
    var _pool       = [];
    
    var generator   = Object.create(client);
    
    /**
     * Добавляет идентификатор обработчика событий в пул генератора
     * 
     * @param {String} id
     */
    generator.addHandlerId = function(id) {
        _pool.push(id);
        if (_pool.length === 1) {
            this.send();
        }
        log.info('GENERATOR Connect a new handler:', id);
    },

    /**
     * Получает идентификатор обработчика из пула генератора
     * 
     * @returns {Strind} _pool[rand]
     */
    generator.getHandlerId = function(){
        var rand = Math.floor(Math.random() * _pool.length);
        return _pool[rand];
    },


    /**
     * Удаляет идентификатор обработчика событий из пула генератора
     * 
     * @param {String} id
     */
    generator.removeHandlerId = function(id) {
        for (var i = 0, length = _pool.length; i< length; i++) {
            if  (_pool[i] === id) {
                _pool.splice(i, 1);
            }
        }
        log.info('GENERATOR Disconnect a handler:', id);
    },


    /**
     * Восстанавливает пул генератора из списка обработчиков
     * 
     * @param {String} handlerList
     */
    generator.restorePool = function(handlerList) {

        _pool = JSON.parse(handlerList);

        this.removeHandlerId(this.id);

        log.info('GENERATOR Restore pool:', _pool);
    },


    /**
     * Подписка на события от обработчиков сообщений
     */
    generator.subscribe = function() {

        subscriber.subscribe('ADD:HANDLER');
        subscriber.subscribe('REMOVE:HANDLER');

        subscriber.on("message", function(channel, message) {

            switch (channel) {

                case 'ADD:HANDLER':

                    this.addHandlerId(message);

                    break;

                case 'REMOVE:HANDLER':

                    this.removeHandlerId(message);

                    break;
            }

        }.bind(this));
    },
            
    /**
     * Отписка от событий
     */
    generator.unsubscribe = function() {
         subscriber.unsubscribe();
    }


    /**
     * Генерирует сообщение для обработчиков
     */
    generator.getMessage = function(){
        this.cnt = this.cnt || 0;
        return this.cnt++;
    },


    /**
     * Отправляет сообщения обработчикам
     */
    generator.send = function() {

        setTimeout(function() {

            if (_pool.length > 0) {

                var handlerId   = this.getHandlerId();
                var message     = this.getMessage();

                publisher.publish(handlerId + ':MESSAGE', 'Hello ' + message);

                log.info('GENERATOR Send message:', handlerId, 'Hello ' + message); 

                this.send();
            }

        }.bind(this), 2000);

    },

    /**
     * Остановка текущего генератора. 
     * Публикует сообщение всем обработчикам о назначении нового генератора.
     * Передает новому генератору пул обработчиков 
     */
    generator.close = function() {

        subscriber.unsubscribe();

        if (_pool.length > 0) {
            var handlerId       = this.getHandlerId();
            var setPoolChannel  = handlerId + ':SET:POOL';

            publisher.publish('SET:GENERATOR', handlerId); 
            publisher.publish(setPoolChannel, JSON.stringify(_pool));
            
            log.info('GENERATOR', setPoolChannel, JSON.stringify(_pool)); 
        };

    };
    
    return generator;
           
};