/*********************************************************************/
/* function create_state belongs to https://github.com/DutchmanNL    */
/* Thanks for sharing!                                               */
/*********************************************************************/

const disableSentry = true; // Ensure to set to true during development!
let stateExpire = {}, warnMessages = {}, stateAttr = {};

function init(adapter, stateAttribute) {
    adapter.createdStatesDetails = {};
    stateAttr = stateAttribute;
}

/**
 * @param {object} adapter Adapter-Class
 */
async function setLastStartTime(adapter) {
    await create_state(adapter, 'online', 'online', true);
}

/**
 * Traeverses the json-object and provides all information for creating/updating states
 * @param {object} adapter Adapter-Class
 * @param {object} o Json-object to be added as states
 * @param {string | null} parent Defines the parent object in the state tree
 * @param {boolean} replaceName Steers if name from child should be used as name for structure element (channel)
 * @param {boolean} replaceID Steers if ID from child should be used as ID for structure element (channel)
 */
async function TraverseJson(adapter, o, parent = null, replaceName = false, replaceID = false, state_expire = 0) {
    let id = null;
    let value = null;
    let name = null;

    try {
        for (var i in o) {
            name = i;
            if (!!o[i] && typeof (o[i]) == 'object' && o[i] == '[object Object]') {
                if (parent == null) {
                    id = i;
                    if (replaceName) {
                        if (o[i].name) name = o[i].name;
                    }
                    if (replaceID) {
                        if (o[i].id) id = o[i].id;
                    }
                } else {
                    id = parent + '.' + i;
                    if (replaceName) {
                        if (o[i].name) name = o[i].name;
                    }
                    if (replaceID) {
                        if (o[i].id) id = parent + '.' + o[i].id;
                    }
                }
                // Avoid channel creation for empty arrays/objects
                if (Object.keys(o[i]).length !== 0) {
                    console.log(`park`);
                    await adapter.setObjectAsync(id, {
                        'type': 'channel',
                        'common': {
                            'name': name,
                        },
                        'native': {},
                    });
                    TraverseJson(adapter, o[i], id, replaceName, replaceID);
                } else {
                    console.log('State ' + id + ' received with empty array, ignore channel creation');
                    adapter.log.debug('State ' + id + ' received with empty array, ignore channel creation');
                }
            } else {
                value = o[i];
                if (parent == null) {
                    id = i;
                } else {
                    id = parent + '.' + i
                }
                if (typeof (o[i]) == 'object') value = JSON.stringify(value);
                //avoid state creation if empty
                if (value != '[]') {
                    adapter.log.debug('create id ' + id + ' with value ' + value + ' and name ' + name);
                    create_state(adapter, id, name, value, state_expire);
                }
            }
        }
    } catch (error) {
        adapter.log.error(`Error in function TraverseJson: ${error}`);
    }
}


/**
 * Function to handle state creation
 * proper object definitions
 * rounding of values
 * @param {object} adapter Adapter-Class (normally "this")
 * @param stateName {string} ID of the state
 * @param name {string} Name of state (also used for stattAttrlib!)
 * @param value {boolean | string | null} Value of the state
 */
async function stateSetCreate(adapter, stateName, name, value, expire = 0) {
    adapter.log.debug('Create_state called for : ' + stateName + ' with value : ' + value);
    try {

        /**
         * Value rounding 1 digits
         * @param {number} [value] - Number to round with . separator
         */
        function rondOneDigit(value) {
            try {
                let rounded = Number(value);
                rounded = Math.round(rounded * 100) / 100;
                adapter.log.debug(`roundCosts with ${value} rounded ${rounded}`);
                if (!rounded) return value;
                return rounded;
            } catch (error) {
                adapter.log.error(`[roundCosts ${value}`);
                adapter.sendSentry(error);
            }
        }
        /**
         * Value rounding 2 digits
         * @param {number} [value] - Number to round with , separator
         */
        function roundTwoDigits(value) {
            let rounded;
            try {
                rounded = Number(value);
                rounded = Math.round(rounded * 100) / 100;
                adapter.log.debug(`roundDigits with ${value} rounded ${rounded}`);
                if (!rounded) return value;
                return rounded;
            } catch (error) {
                adapter.log.error(`[roundDigits ${value}`);
                adapter.sendSentry(error);
                rounded = value;
                return rounded;
            }
        }
        /**
         * Value rounding 3 digits
         * @param {number} [value] - Number to round with , separator
         */
        function roundThreeDigits(value) {
            let rounded;
            try {
                rounded = Number(value);
                rounded = Math.round(rounded * 1000) / 1000;
                adapter.log.debug(`roundDigits with ${value} rounded ${rounded}`);
                if (!rounded) return value;
                return rounded;
            } catch (error) {
                adapter.log.error(`[roundDigits ${value}`);
                adapter.sendSentry(error);
                rounded = value;
                return rounded;
            }
        }

        // Try to get details from state lib, if not use defaults. throw warning is states is not known in attribute list
        const common = {};
        if (!stateAttr[name]) {
            const warnMessage = `State attribute definition missing for '${name}'`;
            if (warnMessages[name] !== warnMessage) {
                warnMessages[name] = warnMessage;
                // Send information to Sentry
                sendSentry(adapter, warnMessage);
            }
        }
        common.name = stateAttr[name] !== undefined ? stateAttr[name].name || name : name;
        common.type = typeof (value);
        common.role = stateAttr[name] !== undefined ? stateAttr[name].role || 'state' : 'state';
        common.read = true;
        common.unit = stateAttr[name] !== undefined ? stateAttr[name].unit || '' : '';
        common.write = stateAttr[name] !== undefined ? stateAttr[name].write || false : false;
        if ((!adapter.createdStatesDetails[stateName])
            || (adapter.createdStatesDetails[stateName]
                && (
                    common.name !== adapter.createdStatesDetails[stateName].name
                    || common.name !== adapter.createdStatesDetails[stateName].name
                    || common.type !== adapter.createdStatesDetails[stateName].type
                    || common.role !== adapter.createdStatesDetails[stateName].role
                    || common.read !== adapter.createdStatesDetails[stateName].read
                    || common.unit !== adapter.createdStatesDetails[stateName].unit
                    || common.write !== adapter.createdStatesDetails[stateName].write
                )
            )) {

            // console.log(`An attribute has changed : ${state}`);
            await adapter.extendObjectAsync(stateName, {
                type: 'state',
                common
            });

        } else {
            // console.log(`Nothing changed do not update object`);
        }

        // Store current object definition to memory
        adapter.createdStatesDetails[stateName] = common;

        // Check if value should be rounded, active switch
        const roundingOneDigit = stateAttr[name] !== undefined ? stateAttr[name].round_1 || false : false;
        const roundingTwoDigits = stateAttr[name] !== undefined ? stateAttr[name].round_2 || false : false;
        const roundingThreeDigits = stateAttr[name] !== undefined ? stateAttr[name].round_3 || false : false;

        // Set value to state
        if (value !== null || value !== undefined) {
            // Check if value should be rounded, if yes execute
            if (typeof value == 'number' || typeof value == 'string') {
                if (roundingOneDigit) {
                    value = rondOneDigit(value);
                } else if (roundingTwoDigits) {
                    value = roundTwoDigits(value);
                } else if (roundingThreeDigits) {
                    value = roundThreeDigits(value);
                }
            }
            await adapter.setStateAsync(stateName, {
                val: value,
                ack: true,
                expire: expire
            });
        }

        // Timer to set online state to FALSE when not updated
        if (name === 'online') {
            // Clear running timer
            if (stateExpire[stateName]) {
                clearTimeout(stateExpire[stateName]);
                stateExpire[stateName] = null;
            }

            // timer
            stateExpire[stateName] = setTimeout(async () => {
                await adapter.setStateAsync(stateName, {
                    val: false,
                    ack: true,
                });
                adapter.log.info('Online state expired for ' + stateName);
            }, adapter.executioninterval * 1000 + 5000);
            adapter.log.debug('Expire time set for state : ' + name + ' with time in seconds : ' + (adapter.executioninterval + 5));
        }

        // Subscribe on state changes if writable
        common.write && adapter.subscribeStates(stateName);

    } catch (error) {
        adapter.log.error('Create state error = ' + error);
    }
}

/**
 * @param {object} adapter Adapter-Class
 * @param {string} msg Error message
 */
function sendSentry(adapter, msg) {
    try {
        if (!disableSentry) {
            adapter.log.info(`[Error catched and send to Sentry, thank you collaborating!] error: ${msg}`);
            if (adapter.supportsFeature && adapter.supportsFeature('PLUGINS')) {
                const sentryInstance = adapter.getPluginInstance('sentry');
                if (sentryInstance) {
                    sentryInstance.getSentryObject().captureException(msg);
                }
            }
        } else {
            adapter.log.warn(`Sentry disabled, error catched : ${msg}`);
            console.error(`Sentry disabled, error catched : ${msg}`);
        }
    } catch (error) {
        adapter.log.error(`Error in function sendSentry: ${error}`);
    }
}

/**
 * Handles the expire if a value is no longer responsed in the API call
 * @param {object} adapter Adapter-Class
 * @param {string} searchpattern defines wich states should be checked, e.g. '*' or 'xyz.abcd.*' or 'xyz.*ab*.fgh'
 */
async function checkExpire(adapter, searchpattern) {
    try {
        let state = await adapter.getStateAsync('online');
        let onlineTs = 0;
        if (state) {
            if (state.val == true) {
                onlineTs = state.ts;
            } else {
                adapter.log.error('Adapter is offline. Aborting checkExpire...');
                return;
            }
        } else {
            adapter.log.error(`Attribute 'online' not found. Aborting checkExpire...`);
            return;
        }

        const states = await adapter.getStatesAsync(searchpattern);
        for (const idS in states) {
            let state = await adapter.getStateAsync(idS);
            adapter.log.debug(idS + ': ' + state);
            if (state && state.val != null) {
                let stateTs = state.ts;
                let dif = onlineTs - stateTs;
                adapter.log.debug(`${idS}: ${stateTs} | ${onlineTs} | ${dif}`);
                if ((onlineTs - stateTs) > 0) {
                    await adapter.setStateAsync(idS, null, true);
                    adapter.log.debug(`Set state ${idS} to null`);
                }
            }
        }
    } catch (error) {
        adapter.log.error(`Error in function checkExpire: ${error}`);
    }
}

module.exports = {
    TraverseJson: TraverseJson,
    stateSetCreate: stateSetCreate,
    checkExpire: checkExpire,
    init: init,
    setLastStartTime: setLastStartTime
};
