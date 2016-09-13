var winston = require('winston');

module.exports = function(module) {
    return makeLogger(module.filename);
};

function makeLogger(path) {

   // if (path.match(/generator.js$/)) {
        
        var transports = [
            new winston.transports.Console({
                timestamp: true,
                colorize: true,
                level: 'info'
            }),
            
            //new winston.transport.File({filename: "debug.log", level: "debug" })
        ];
        
        return new winston.Logger({transports: transports });  
        
//    } else {
//        
//        return new winston.Logger({
//            transports: [] 
//        });   
//        
//    }
}

