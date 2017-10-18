/**
 * Created by matyz on 07/09/16.
 */


const status = {
    RESOURCE_MANAGER: {
        ALL_RECOURCES_PASSED_SUCCESSFULLY: "all resources finished successfully",
    },
    PREREQUISITE: {
        FAIL_REASON: {
            RETRIES_AMOUNT_REACHED: "retries amount was reached and therefore the readiness test fail",
            CURRENTLY_UNHEALTHY: "the test fail your system is currently on unhealthy state",
            SINGLE_FAIL:"one test was failed don't worry there are more retries",
            UNHEALTHY_RETRIES_AMOUNT_REACHED:"there was probably a major problem that prevent this resource from report healthy"
        },
    }

}

module.exports = status;