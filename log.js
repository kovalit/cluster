"use strict";

var winston = require('winston');

module.exports = function(module) {
    return makeLogger(module.filename); 
};

function makeLogger(path) {

    if (path.match(/generator.js$/)) {
        var transports = [
            new winston.transports.Console({
                colorize: true,
                level: 'info'
            }),
            
            new (winston.transports.File)({ filename: "logs/generator.log", timestamp: false })
        ];
        
    } else if (path.match(/handler.js$/)) {
        var transports = [
            new winston.transports.Console({
                colorize: true,
                level: 'info'
            }),
            
            new (winston.transports.File)({ filename: "logs/handler.log",  timestamp: false })
        ];
        
    } else {
        
        var transports = [
            new winston.transports.Console({
                colorize: true,
                level: 'info'
            }) 
        ];
        
    }
        
    return new winston.Logger({
        transports: transports 
    });   
        
    
}

