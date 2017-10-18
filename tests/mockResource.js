/**
 * Created by matyz on 06/09/16.
 */


'use strict'
const prerequisiteBase = require('../prerequisiteBase');
const states = {
    PASS:"pass",
    FAIL:"fail",
    RANDOM:"random"
}
class mockResource extends prerequisiteBase {
    constructor(name) {
        super();
        this._mockState= states.PASS;
        this.name = name||this.name;
    }
    updateMockeryState(state){
        this._mockState=state;
    }
    Job(){
        return new Promise((resolve, reject)=> {

                 if(this._mockState ==states.PASS){
                     resolve("job passed");
                 }
                 else if (this._mockState==states.FAIL) {
                    reject("all failed");
                 }
                 else if(this._mockState==states.RANDOM){
                     if(Math.random()==1){
                        resolve("pass random");
                         }
                     else if(Math.random()==0)
                     {
                         reject("random rejected");
                     }
                 }



        });
    }
    setDefaultOptions(){
        this.name = "mockery";
        this._cronTemplate = '*/1 * * * * *';
        this._retriesAmount = 5;
    }
}


module.exports = mockResource;