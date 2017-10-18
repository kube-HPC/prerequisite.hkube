/**
 * Created by matyz on 19/09/16.
 */



'use strict'
const prerequisiteBase = require('../prerequisiteBase');

const keepaliveService  = require('keepalive-service').Service;

class rmsMicroSerivces extends prerequisiteBase {

    constructor(options) {
        super();
        this._options = options;
        this.type = options.type;
        this.name = `rms - ${options.type} `;
       // this.updateName(this._name);
        this._redisOptions = {host:options.host,port:options.port},
        this._keepAliveService  = new keepaliveService(this._redisOptions);


    }
    Job(){
        return new Promise((resolve, reject)=> {
            this._keepAliveService.getKeys(this.type)
                .then((results)=>{
                    if(results){
                        if (results.length>0) {
                            resolve(results)
                        }
                        else {
                            reject("there was no keys that found under that prefix")
                        }
                    }

                    else {
                        reject("there was no keys that found under that prefix")
                    }


                })

        });


    }

    setDefaultOptions(){
        this.name = `rms` ;
        this._cronTemplate = '*/3 * * * * *';
        this._retriesAmount = 5;
    }

}

module.exports.Consts = {
    supervisor:"supervisor",
    signalling:"signalling",
    //worker: "worker",
    catalog: "catalog",
    auth:"auth",
    sds:"sds",
    kurentoCluster:"kurentoCluster"

}
module.exports.RmsMicroSerivces = rmsMicroSerivces;
