/**
 * Created by matyz on 11/09/16.
 */


'use strict'
const prerequisiteBase = require('../prerequisiteBase');
const monitor = require('redis-utils').Monitor;

class redisPrerquiste extends prerequisiteBase {

    constructor(config){
        super();
        this._config = config;
    }

    Job(){
      return new Promise((resolve,reject)=>{
          monitor.check(
              {
                  host:this._config.host,
                  port :this._config.port,
                  retryTimeout:2000,
                  closeAfter:true

              })
              .then(()=>{
                  resolve('redis is up and running');
              })
              .catch(()=>{
                  reject(`redis fail to answer after ${this._retriesAmount} with ${this._cronTemplate} between them`);
              })
      })

    }

    setDefaultOptions(){
        this.name = "redis";
        this._cronTemplate = '*/3 * * * * *';
        this._retriesAmount = 5;
    }






}

module.exports = redisPrerquiste;