"use strict";
/* 
 * "Абстрактный класс" для генератора и обработчика событий
 */

var log = require('./log')(module);

module.exports = function(CLIENT_TYPE) {
    
    return {
        
        /**
         * Идентификатор текущего экземпляра программы
         */
        id:  null,


        /**
         * Устанавливает идентификатор текущего экземпляра
         * 
         * @param {String} id
         */
        setId: function(id) {
            this.id = id;
            log.info(CLIENT_TYPE, 'Set client id:', id);
        },        
        
        /*
         * Добавляет себя в список подключенных клиентов
         */
        add: function() {
            return null;
        },


        /**
         * Подписка на события
         */
        subscribe: function() {
            return null;
        },
        
        /**
         * Отписка от событий
         */
        unsubscribe: function() {
            return null;
        },


        /**
         * Закрытие клиента
         */
        close: function() {
            return null;
        }
        
    }

}

