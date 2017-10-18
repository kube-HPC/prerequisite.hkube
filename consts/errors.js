/**
 * Created by matyz on 07/09/16.
 */
const errors = {

    RESOURCE_MANAGER: {
        INSTANCE_NOT_PREREQUISITE: 'the resource is not instance of prerequisite Base',
    },
    PREREQUISITE: {
       NAME_MUST_BE_SET:"name must be set",
       UNREGISTERED_JOB:"there is no job to run",
       OPTIONS_NOT_SET:"options and default options does not set or overridden"
    }

}

module.exports = errors;