/**
 * Created by matyz on 08/09/16.
 */
'use strict'
const mockery = require('mockery');
const mockeryTemp = require('./mockResource');
const resourceManager = require('../resourceManager');
const MESSAGES = require('../consts/messages');
const STATUS = require('../consts/status');
const ERRORS =require('../consts/errors');

let _mockery = new mockeryTemp();
let _resourceManager = new resourceManager();
_mockery.updateMockeryState("fail");
_resourceManager.setResourceForReadinessCheck(_mockery.name, _mockery).run()
    .onEach((result)=> {
        console.log(result);
    })
    .all((allResult)=> {
    console.log(allResult);

}).catch((errorResult)=> {
    console.log(errorResult);
})