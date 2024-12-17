// HERE IN LIES THE APPLICATION LOGGER

// GET THE `fs` MODULE
const fs = require('fs');

module.exports = (req, res, next) => {
    const url = req.url,
          method = req.method,
          ip = req.ip,
          params = req.params;

    try{
        fs.appendFileSync('logs.csv',`${ip}, ${method}, ${url}, ${params} \n`,'utf8');
    }catch(err){
        console.error('Error Logging Request')
    }

    next()

}