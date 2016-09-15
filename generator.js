"use strict";

var async   = require('async');
var log     = require('./log')(module);
var client  = require('./client')('GENERATOR');

module.exports = function (publisher, subscriber, redisClient) {
    
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
    };

    /**
     * Получает идентификатор обработчика из пула генератора
     * 
     * @returns {Strind} _pool[rand]
     */
    generator.getHandlerId = function(){
        var rand = Math.floor(Math.random() * _pool.length);
        return _pool[rand];
    };


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
    };
            
            
    /**
     * Восстанавливает генератор
     */
    generator.restore = function() {
        async.waterfall([
            
                this.restorePool.bind(this),
                
                this.restoreCounter.bind(this)
                
            ], function (err) {
                
                if(err) throw err;
                
                this.send();
                
          }.bind(this));
    };


    /**
     * Восстанавливает пул генератора из списка обработчиков
     */
    generator.restorePool = function(callback) {

        redisClient.get("pool", function(err, poolString) {
            if (err) throw err;

            _pool = JSON.parse(poolString);
            
            this.removeHandlerId(this.id);
            
            log.info('GENERATOR Restore pool:', this.id);
            
            callback(null);

        }.bind(this));
           
    },
            
    /**
     * Восстанавливает счетчик
     */
    generator.restoreCounter = function(callback) {

        redisClient.get("counter", function(err, cnt) {
            if (err) throw err;
            
            this.cnt = cnt;
            
            log.info('GENERATOR Restore counter:', this.cnt);
            
            callback(null);

        }.bind(this));
           
    };


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
    };
            
    /**
     * Отписка от событий
     */
    generator.unsubscribe = function() {
         subscriber.unsubscribe();
    };


    /**
     * Генерирует сообщение для обработчиков
     */
    generator.getMessage = function(){
        this.cnt = this.cnt || 0;
        return this.cnt++;
    };


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

    };

    /**
     * Остановка текущего генератора. Выбираем новый генератор и публикуем для 
     * него соответствующее событие. Назначение генератора позволит избежать 
     * излишних действий со стороны обработчиков. Другой вариант - генератором 
     * становится обработчик, который первым занял его место.
     * 
     */
    generator.close = function(callback) {
        
        if (_pool.length > 0) {
            var handlerId       = this.getHandlerId();
            var setGenChannel   = handlerId + ':SET:GENERATOR';

            publisher.publish(setGenChannel, handlerId); 
            redisClient.set("pool", JSON.stringify(_pool));
            redisClient.set("counter", this.cnt);
            
            log.info('GENERATOR Set generator:', handlerId); 
        };
        
        redisClient.del("generatorId", function(err, o) {
            if (err) throw err;
            
            log.info('GENERATOR Delete generatorId key in redis'); 
            
            subscriber.unsubscribe();
            publisher.quit();
            subscriber.quit();
            redisClient.quit();
            
            log.info('GENERATOR Close');
            
            callback();
         
        });

    };
    
    return generator;
           
};