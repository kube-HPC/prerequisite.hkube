/**
 * Created by matyz on 06/09/16.
 */
"use strict";
const chai = require("chai");
const expect = chai.expect;
const sinon = require('sinon');
const mockery = require('mockery');
const mockeryTemp = require('./mockResource');
const resourceManager = require('../resourceManager');
const MESSAGES = require('../consts/messages');
const STATUS = require('../consts/status');
const ERRORS =require('../consts/errors');
const redisBuiltIn= require('../Built-in/redis');
const rmsBuitInPrerequisite= require('../Built-in/rms-micro-serivces').RmsMicroSerivces;
const rmsBuitInConstTypes= require('../Built-in/rms-micro-serivces').Consts;

const keepAlive =require('keepalive-service').Client;
const uuid = require('uuid');
const redisHost = process.env.REDIS_SERVICE_HOST ||'localhost';

describe('readiness-sanity-check', ()=> {
    beforeEach(()=> {

    })
    it('test-simple-readiness-test', (done)=> {

        let _mockery = new mockeryTemp();
        let _resourceManager = new resourceManager();
        _mockery.updateMockeryState("pass");
        _resourceManager.setResourceForReadinessCheck(_mockery.name, _mockery).run()
            .onEach((result)=> {
                console.log(result);
                expect(result.jobDetails.name).to.contain(_mockery.name);
                expect(result.jobDetails.currentRetriesAmount).to.eql(1);
                expect(result.jobDetails.status).to.eql("success");
            }).all((allResult)=> {
            console.log(allResult);
            done();
        }).catch((errorResult)=> {
            console.log(errorResult);

        })
    }).timeout(3000)
    it('test-simple-readiness-test-with-updated-interval', (done)=> {

        let _mockery = new mockeryTemp();
        _mockery.setCronJobInterval("*/3 * * * * * *")
        let _resourceManager = new resourceManager();
        _mockery.updateMockeryState("pass");
        _resourceManager.setResourceForReadinessCheck(_mockery.name, _mockery).run()
            .onEach((result)=> {
                console.log(result);
                expect(result.jobDetails.name).to.contain(_mockery.name);
                expect(result.jobDetails.currentRetriesAmount).to.eql(1);
                expect(result.jobDetails.status).to.eql("success");
            }).all((allResult)=> {
            expect(allResult.description).to.eql(STATUS.RESOURCE_MANAGER.ALL_RECOURCES_PASSED_SUCCESSFULLY);

            console.log(allResult);
            done();
        }).catch((errorResult)=> {
            console.log(errorResult);
        })
    }).timeout(4000)
    it('test-multiple-prerequisites-job-called-once', (done)=> {

        let _mockery = new mockeryTemp();
        let _mockery2 = new mockeryTemp("mockery2");
        let _resourceManager = new resourceManager();
        let Job = sinon.spy(_mockery, "Job");
        let Job2 = sinon.spy(_mockery2, "Job");
        _mockery.updateMockeryState("pass");
        _resourceManager.setResourceForReadinessCheck(_mockery.name, _mockery)
            .setResourceForReadinessCheck(_mockery2.name, _mockery2).run().onEach((result)=> {
            console.log(result);

            expect(result.jobDetails.currentRetriesAmount).to.eql(1);
            expect(result.jobDetails.status).to.eql("success");
        }).all((allResult)=> {
            expect(allResult.description).to.eql(STATUS.RESOURCE_MANAGER.ALL_RECOURCES_PASSED_SUCCESSFULLY);
            // callOnEach.restore();
            sinon.assert.calledOnce(Job);
            sinon.assert.calledOnce(Job2);
            console.log(allResult);
            done();
        }).catch((errorResult)=> {
            console.log(errorResult);
        })
    }).timeout(5000)
    afterEach(()=> {

    })

})


describe('rediness-failuare', ()=> {
    beforeEach(()=> {

    })
    it('should-report-rediness-failuare', (done)=> {
        let _mockery = new mockeryTemp();
        let _resourceManager = new resourceManager();
        _mockery.updateMockeryState("fail");
        _resourceManager.setResourceForReadinessCheck(_mockery.name, _mockery).run()
            .onEach((result)=> {
                console.log(result);
            }).all((allResult)=> {
            console.log(allResult);

        }).catch((errorResult)=> {
            console.log(errorResult);
            expect(errorResult.jobDetails.currentRetriesAmount).to.eql(5);
            expect(errorResult.jobDetails.status).to.eql('fail');
            expect(errorResult.error).to.eql(STATUS.PREREQUISITE.FAIL_REASON.RETRIES_AMOUNT_REACHED);
            done();
        })
    }).timeout(7000);
    it('should-report-success-at-the-third', (done)=> {
        let setTosuccessCounter =0;
        let _mockery = new mockeryTemp();

        let _resourceManager = new resourceManager();
        _mockery.updateMockeryState("fail");
        _resourceManager.setResourceForReadinessCheck(_mockery.name, _mockery).run()
            .onEach((result)=> {
                expect(result.jobDetails.currentRetriesAmount).to.eql(4);
                expect(result.jobDetails.status).to.eql('success');
                console.log(result);
            })
            .onEachFailure((result)=>{
                setTosuccessCounter ++;
                if(setTosuccessCounter>=3){
                    _mockery.updateMockeryState("pass");
                }
                expect(result.jobDetails.currentRetriesAmount).to.be.below(4);
                console.log(result);

            })
            .all((allResult)=> {
            expect(allResult.description).to.eql(STATUS.RESOURCE_MANAGER.ALL_RECOURCES_PASSED_SUCCESSFULLY);

                console.log(allResult);
                    done();
        }).catch((errorResult)=> {
            console.log(errorResult);



        })
    }).timeout(7000)
    afterEach(()=> {

    })
})

describe('healthyness-sanity-check', ()=> {
    beforeEach(()=> {

    })
    it('simple-test', (done)=> {
        let _mockery = new mockeryTemp();
        let _mockery2 = new mockeryTemp();
        let _expectedAmountResult = 1;
        let _resourceManager = new resourceManager();
        _resourceManager.setResourceForHealtinessCheck(_mockery.name, _mockery).setResourceForHealtinessCheck("mockery2",_mockery2).run()
            .onEach((result)=> {
                console.log(result);
                expect(result.jobDetails.name).to.contain(_mockery.name);
                expect(result.jobDetails.currentRetriesAmount).to.eql(0);
                expect(result.jobDetails.status).to.eql("success");
                expect(result.jobDetails.checksAmounts).to.eql(_expectedAmountResult);
                _expectedAmountResult++;
                if(result.jobDetails.checksAmounts>3) {
                    _resourceManager.cancelHealthynessJob(()=> {
                        done();

                    })
                }
          })
            .onEachFailure(()=>{

            })
            .catch((errorResult)=> {
                console.log(errorResult);

            })
    }).timeout(5000)
    afterEach(()=> {

    })
})

describe('built-in-tests', ()=> {
    beforeEach(()=> {

    })
    it('redis', (done)=> {
        let _redis = new redisBuiltIn({host:redisHost,port:6379});
        let _resourceManager = new resourceManager();
        _resourceManager.setResourceForReadinessCheck(_redis.name, _redis).run()
            .onEach((result)=> {
                console.log(result);
                expect(result.jobDetails.name).to.contain(_redis.name);
                expect(result.jobDetails.currentRetriesAmount).to.eql(1);
                expect(result.jobDetails.status).to.eql("success");
            }).all((allResult)=> {
            console.log(allResult);
            done();
        }).catch((errorResult)=> {
            console.log(errorResult);
            done();

        })
    }).timeout(20000)
    it('rms-resources', (done)=> {
        let _keepAliveArr = [];
        for (let prop in rmsBuitInConstTypes) {

         let _keepAlive =  new keepAlive({
                host: redisHost,
                'port': 6379,
                timeout: 50000,
                interval: 1000,
                'prefix': prop,
                'uuid':uuid.v4()

            })
            _keepAlive.start();
            _keepAliveArr.push(_keepAlive)
        }

        let _catalogRmsBuitInPrerequisite = new rmsBuitInPrerequisite({host:redisHost,port:6379,type:rmsBuitInConstTypes.catalog});
        let _supervisorRmsBuitInPrerequisite = new rmsBuitInPrerequisite({host:redisHost,port:6379,type:rmsBuitInConstTypes.supervisor});
       let _signallingRmsBuitInPrerequisite = new rmsBuitInPrerequisite({host:redisHost,port:6379,type:rmsBuitInConstTypes.signalling});
        let _resourceManager = new resourceManager();
        _resourceManager
            //.setResourceForReadinessCheck(_catalogRmsBuitInPrerequisite.type +_catalogRmsBuitInPrerequisite.name, _catalogRmsBuitInPrerequisite)
            .setResourceForReadinessCheck(_supervisorRmsBuitInPrerequisite.type+_supervisorRmsBuitInPrerequisite.name, _supervisorRmsBuitInPrerequisite)
            .setResourceForReadinessCheck(_signallingRmsBuitInPrerequisite.type+ _signallingRmsBuitInPrerequisite.name, _signallingRmsBuitInPrerequisite)
            .run()
            .onEach((result)=> {
                console.log(result);
                expect(result.jobDetails.description[0][0]).to.contain('**keepAlive**');
                expect(result.jobDetails.currentRetriesAmount).to.eql(1);
                expect(result.jobDetails.status).to.eql("success");
            }).all((allResult)=> {
            console.log(allResult);
            _keepAliveArr.forEach((_keepAlive)=>{
                _keepAlive.stop();
            })
            done();
        }).catch((errorResult)=> {
            console.log(errorResult);
            done();

        })
    }).timeout(20000)
    afterEach(()=> {

    })
})