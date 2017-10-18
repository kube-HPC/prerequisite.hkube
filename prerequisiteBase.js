/**
 * Created by matyz on 04/09/16.
 */

'use strict'

//const CronJob = require('cron').CronJob;
const schedule = require('node-schedule');
const EventEmitter = require('events');
const MESSAGES = require('./consts/messages');
const STATUS = require('./consts/status').PREREQUISITE;
const ERRORS = require('./consts/errors').PREREQUISITE;


class prerequisiteBase extends EventEmitter {
    constructor(name, options) {
        super();

        if (options == null) {
            this.setDefaultOptions()
        }
        else {
            this._cronTemplate = options._cronTemplate;
            this._retriesAmount = options._retriesAmount;
        }
        if (name == null) {
            if (this.name == null) {
                throw new Error(ERRORS.NAME_MUST_BE_SET);
            }
        }
        else {
            this.name = name;
        }

        this.cronJob = null;

        this._isHealthy = false;
        this._currentRetriesAmount = 0;
        this._checksAmounts = 0;
    }

    //override this method
    job() {
        throw new Error(ERRORS.OPTIONS_NOT_SET);
    }

    //override this method
    setDefaultOptions() {
        throw new Error(ERRORS.UNREGISTERED_JOB);
    }
    updateName(name){
        this.name = name;
    }
    setCronJobInterval(cronTemplate) {
        this._cronTemplate = cronTemplate;
    }

    setRetriesNumber(retriesAmount) {
        this._retriesAmount = retriesAmount;
    }

    _isHealthy(isHealthy) {
        this._isHealthy = isHealthy;
    }

    run(cb) {
        if (this._isHealthy) {
            this.runAsHealthyJob(cb);
        }
        else {
            this.runAsReadinessJob(cb);
        }

        return {fail: this.fail}
    }

    _jobResultTemplate(status, description) {
        return {
            name: this.name,
            currentRetriesAmount: this._currentRetriesAmount,
            status: status ? "success" : "fail",
            description: description,
            retriesAmount:this._retriesAmount,
            jobInstance:this,


        }
    }
    _jobResultHealthyTemplate(status, description) {
        return {
            name: this.name,
            checksAmounts:this._checksAmounts,
            currentRetriesAmount: this._currentRetriesAmount,
            status: status ? "success" : "fail",
            description: description,
            retriesAmount:this._retriesAmount,
            jobInstance:this

        }
    }

    runAsHealthyJob(_cb) {
        let cb = _cb || function () {};
         this.cronJob = new schedule.scheduleJob(this._cronTemplate, ()=> {
            this._checksAmounts++;
            this.Job().then((description)=> {
              //  this._currentRetriesAmount++;
                cb("", this._jobResultHealthyTemplate(true, description))
                this.emit(MESSAGES.HEALTHYNESS_SUCCESS, {
                    error: "",
                    jobDetails: this._jobResultHealthyTemplate(true, description)
                })
                this._currentRetriesAmount = 0;
            }).catch((description)=> {
                if (this._currentRetriesAmount <= this._retriesAmount) {
                    this._currentRetriesAmount++;
                    this.emit(MESSAGES.CURRENTLY_UNHEALTHY, {
                        error: STATUS.FAIL_REASON.CURRENTLY_UNHEALTHY,
                        jobDetails: this._jobResultHealthyTemplate(true, description)
                    })
                }
                else{
                    cb(STATUS.FAIL_REASON.CURRENTLY_UNHEALTHY, this._jobResultHealthyTemplate(true, description))
                    this.emit(MESSAGES.UNHEALTHY_RETRIES_AMOUNT_REACHED, {
                        error: STATUS.FAIL_REASON.UNHEALTHY_RETRIES_AMOUNT_REACHED,
                        jobDetails: this._jobResultHealthyTemplate(true, description)
                    })
                    this.cronJob.cancel();
                }

            })


        })

    }

    runAsReadinessJob(_cb) {
        let cb = _cb || function () {};
        this.cronJob  = schedule.scheduleJob(this._cronTemplate, ()=> {
            this._currentRetriesAmount++;
            this.Job().then((description)=> {
                this.cronJob.cancel();
                this.emit(MESSAGES.READINESS_SUCCESS, {
                    error: "",
                    jobDetails: this._jobResultTemplate(true, description)
                })
                cb(MESSAGES.READINESS_SUCCESS, this._jobResultTemplate(true, description))
            }).catch((description)=> {
                if (this._currentRetriesAmount >= this._retriesAmount) {
                    this.cronJob.cancel();
                    cb("", this._jobResultTemplate(false, description))
                    this.emit(MESSAGES.RETRIES_AMOUNT_REACHED, {
                        error: STATUS.FAIL_REASON.RETRIES_AMOUNT_REACHED,
                        jobDetails: this._jobResultTemplate(false, description)
                    })

                }
                else {
                    cb(STATUS.FAIL_REASON.SINGLE_FAIL, this._jobResultTemplate(false, description));
                    this.emit(MESSAGES.SINGLE_FAIL, {
                        error: STATUS.FAIL_REASON.SINGLE_FAIL,
                        jobDetails: this._jobResultTemplate(false, description)
                    })
                }

            })


        })


    }

    fail() {

    }
}


module.exports = prerequisiteBase;