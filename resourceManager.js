/**
 * Created by matyz on 04/09/16.
 */

'use strict'

const prerequisiteBase = require('./prerequisiteBase');
const MESSAGES = require('./consts/messages');
const STATUS = require('./consts/status').RESOURCE_MANAGER;
const ERRORS =require('./consts/errors').RESOURCE_MANAGER;
class resourceManager {
    constructor(){
        this.resourceMangerReadinessCheckMap = new Map();
        this.resourceMangerHealtinessCheckMap = new Map();
        this._curruentAllReadinessPassed =0;
        this._onEachFailureCallback = ()=>{};
        this._onEachCallback = ()=>{};
        this._allCallback = ()=>{};
        this._catchCallBack = ()=>{};
    }

    setResourceForReadinessCheck(resourceName,resource) {

            if (resource instanceof prerequisiteBase) {
                this.resourceMangerReadinessCheckMap.set(resourceName, resource);
                return {
                    run:this.runReadinessCheck.bind(this),
                    setResourceForReadinessCheck:this.setResourceForReadinessCheck.bind(this)
                }
            }
            else {
                throw new Error(ERRORS.INSTANCE_NOT_PREREQUISITE)
            }

        }

    setResourceForHealtinessCheck(resourceName,resource) {

            if (resource instanceof prerequisiteBase) {

                this.resourceMangerHealtinessCheckMap.set(resourceName, resource);
                return {
                    run:this.runHealthyCheck.bind(this),
                    setResourceForHealtinessCheck:this.setResourceForHealtinessCheck.bind(this)
                }
            }
            else {
                throw new Error(ERRORS.INSTANCE_NOT_PREREQUISITE)
            }


    }
    runHealthyCheck(){
        this.resourceMangerHealtinessCheckMap.forEach((value,key)=>{
            value.on(MESSAGES.HEALTHYNESS_SUCCESS,(message)=>{

                this._onEachCallback(message);

            });
            value.on(MESSAGES.CURRENTLY_UNHEALTHY,(message)=>{
                this._onEachFailureCallback(message)
            });
            value.on(MESSAGES.UNHEALTHY_RETRIES_AMOUNT_REACHED,(message)=>{
                this._catchCallBack(message)
            });
            value.runAsHealthyJob();

        })
        return {
            onEach:this.onEach.bind(this),
            onEachFailure:this.onEachFailure.bind(this),
            catch:this.catch.bind(this)
        }
    }
    runReadinessCheck(){
        this.resourceMangerReadinessCheckMap.forEach((value,key)=>{
            value.on(MESSAGES.READINESS_SUCCESS,(message)=>{
                this._curruentAllReadinessPassed ++;
                this._onEachCallback(message);
                if(this._curruentAllReadinessPassed==this.resourceMangerReadinessCheckMap.size){
                    this._allCallback(
                        {
                            description:STATUS.ALL_RECOURCES_PASSED_SUCCESSFULLY
                        }
                    )
                }
            });
            value.on(MESSAGES.RETRIES_AMOUNT_REACHED,(message)=>{
                this._catchCallBack(message)
            });
            value.on(MESSAGES.SINGLE_FAIL,(message)=>{
                //console.log(`on-> ${MESSAGES.SINGLE_FAIL} `);
                this._onEachFailureCallback(message)
            });
            value.runAsReadinessJob();

        })
        return {
            onEach:this.onEach.bind(this),
            onEachFailure:this.onEachFailure.bind(this),
            all:this.all.bind(this),
            catch:this.catch.bind(this)
        }
    }

    onEach(cb){
        this._onEachCallback = cb;
        return {
            all:this.all.bind(this),
            onEachFailure:this.onEachFailure.bind(this),
            catch:this.catch.bind(this)
        }

    }
    onEachFailure(cb){
        this._onEachFailureCallback = cb;
        return {
            all:this.all.bind(this),
            onEach:this.onEach.bind(this),
            catch:this.catch.bind(this)
        }

    }
    all(cb){
        this._allCallback =cb;
        return {
            onEach:this.onEach.bind(this),
            onEachFailure:this.onEachFailure.bind(this),
            catch:this.catch.bind(this)
        }
    }
    catch(cb){
        this._catchCallBack = cb;

        return {
            all:this.catch.bind(this),
            onEach:this.onEach.bind(this),
            onEachFailure:this.onEachFailure.bind(this),

        }

    }
    cancelReadinssJob(cb){
        this.resourceMangerReadinessCheckMap.forEach((value,key)=>{
            value.cronJob.cancel();
        })
        cb();
    }
    cancelHealthynessJob(cb){
        this.resourceMangerHealtinessCheckMap.forEach((value,key)=>{
            value.cronJob.cancel();
        })
        cb();

    }
    cancelAll(cb) {
        this.cancelReadinssJob();
        this.cancelHealthynessJob();
        cb();
    }

}


module.exports = resourceManager;




