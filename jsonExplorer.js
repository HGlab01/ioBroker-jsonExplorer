'use strict';

const path = `${__dirname}`;
const { version } = require('./package.json');
let stateExpire = {}, warnMessages = {}, stateAttr = {};
let adapter; //adapter-object initialized by init(); other functions do not need adapter-object in their signatur

/**
 * @param {object} adapter Adapter-Class (normally "this")
 * @param {object} stateAttr check README
 */
function init(adapterOrigin, stateAttribute) {
    adapter = adapterOrigin;
    adapter.createdStatesDetails = {};
    stateAttr = stateAttribute;
}

/**
 * Traeverses the json-object and provides all information for creating/updating states
 * @param {object} jObject Json-object to be added as states
 * @param {string | null} parent Defines the parent object in the state tree; default=root
 * @param {boolean} replaceName Steers if name from child should be used as name for structure element (channel); default=false
 * @param {boolean} replaceID Steers if ID from child should be used as ID for structure element (channel); default=false;
 * @param {number} state_expire expire time for the current setState in seconds; default is no expire
 * @param {number} level level 0 starts with device, level 1 starts with channel, level 3 starts without device & channel
 */
async function TraverseJson(jObject, parent = null, replaceName = false, replaceID = false, state_expire = 0, level = 0) {
    let id = null;
    let value = null;
    let name = '';
    if (parent != null && level == 0) {
        if (replaceName) {
            name = jObject.name ? jObject.name : '';
        }
        await adapter.setObjectAsync(parent, {
            'type': 'device',
            'common': {
                'name': name,
            },
            'native': {},
        });
        level = level + 1;
    } else if (parent != null && level == 1) {
        if (replaceName) {
            name = jObject.name ? jObject.name : '';
        }
        await adapter.setObjectAsync(parent, {
            'type': 'channel',
            'common': {
                'name': name,
            },
            'native': {},
        });
        level = level + 1;
    }

    try {
        for (var i in jObject) {
            name = i;
            if (!!jObject[i] && typeof (jObject[i]) == 'object' && String(jObject[i]).includes('[object Object]')) {
                adapter.log.silly(`Traverse object '${name}' with value '${jObject[i]}' and type '${typeof (jObject[i])}'`);
                if (parent == null) {
                    id = i;
                    if (replaceName) {
                        if (jObject[i].name) name = jObject[i].name;
                    }
                    if (replaceID) {
                        if (jObject[i].id || jObject[i].id == 0) id = jObject[i].id;
                    }
                } else {
                    id = parent + '.' + i;
                    if (replaceName) {
                        if (jObject[i].name) name = jObject[i].name;
                    }
                    if (replaceID) {
                        if (jObject[i].id || jObject[i].id == 0) id = parent + '.' + jObject[i].id;
                    }
                }
                // Avoid channel creation for empty arrays/objects
                if (Object.keys(jObject[i]).length !== 0) {
                    if (level == 0) {
                        await adapter.setObjectAsync(id, {
                            'type': 'device',
                            'common': {
                                'name': name,
                            },
                            'native': {},
                        });
                    } else if (level == 1) {
                        await adapter.setObjectAsync(id, {
                            'type': 'channel',
                            'common': {
                                'name': name,
                            },
                            'native': {},
                        });
                    }
                    TraverseJson(jObject[i], id, replaceName, replaceID, state_expire, level + 1);
                } else {
                    adapter.log.silly('State ' + id + ' received with empty array, ignore channel creation');
                }
            } else {
                adapter.log.silly(`Write state '${name}' with value '${jObject[i]}' and type '${typeof (jObject[i])}'`);
                value = jObject[i];
                if (parent == null) {
                    id = i;
                } else {
                    id = parent + '.' + i
                }
                if (typeof (jObject[i]) == 'object' && value != null) value = JSON.stringify(value);
                //avoid state creation if empty
                if (value != '[]') {
                    adapter.log.silly('create id ' + id + ' with value ' + value + ' and name ' + name);
                    stateSetCreate(id, name, value, state_expire);
                }
            }
        }
    } catch (error) {
        error = `Error in function TraverseJson(): ${error}`;
        adapter.log.error(error);
        sendSentry(error);
    }
}

/**
 * Analysis modify element in stateAttr.js and executes command
 * @param {string} method defines the method to be executed (e.g. round())
 * @param {string | number} value value to be executed 
*/
function modify(method, value) {
    adapter.log.silly(`Function modify with method "${method}" and value "${value}"`);
    let result = null;
    try {
        if (method.match(/^custom:/gi) != null) {                               //check if starts with "custom:"
            value = eval(method.replace(/^custom:/gi, ''));                     //get value without "custom:"
        } else if (method.match(/^multiply\(/gi) != null) {                     //check if starts with "multiply("
            let inBracket = parseFloat(method.match(/(?<=\()(.*?)(?=\))/g));    //get value in brackets
            value = parseFloat(value) * inBracket;
        } else if (method.match(/^divide\(/gi) != null) {                       //check if starts with "divide("
            let inBracket = parseFloat(method.match(/(?<=\()(.*?)(?=\))/g));    //get value in brackets
            value = parseFloat(value) / inBracket;
        } else if (method.match(/^round\(/gi) != null) {                        //check if starts with "round("
            let inBracket = parseInt(method.match(/(?<=\()(.*?)(?=\))/g));      //get value in brackets
            value = Math.round(parseFloat(value) * Math.pow(10, inBracket)) / Math.pow(10, inBracket);
        } else if (method.match(/^add\(/gi) != null) {                          //check if starts with "add("
            let inBracket = parseFloat(method.match(/(?<=\()(.*?)(?=\))/g));    //get value in brackets
            value = parseFloat(value) + inBracket;
        } else if (method.match(/^substract\(/gi) != null) {                    //check if starts with "substract("
            let inBracket = parseFloat(method.match(/(?<=\()(.*?)(?=\))/g));    //get value in brackets
            value = parseFloat(value) - inBracket;
        }
        else {
            let methodUC = method.toUpperCase();
            switch (methodUC) {
                case 'UPPERCASE':
                    if (typeof value == 'string') result = value.toUpperCase();
                    break;
                case 'LOWERCASE':
                    if (typeof value == 'string') result = value.toLowerCase();
                    break;
                case 'UCFIRST':
                    if (typeof value == 'string') result = value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase();
                    break;
                default:
                    result = value;
            }
        }
        if (!result) return value;
        return result;
    } catch (error) {
        error = `Error in function modify for method ${method} and value ${value}: ${error}`;
        adapter.log.error(error);
        adapter.sendSentry(error);
        return value;
    }
}


/**
 * Function to handle state creation
 * proper object definitions
 * rounding of values
 * @param {string} objName ID of the object
 * @param {string} name Name of state (also used for stattAttrlib!)
 * @param {any} value Value of the state
 * @param {number} expire expire time in seconds; default is no expire
 */
async function stateSetCreate(objName, name, value, expire = 0) {
    adapter.log.silly(`Create_state called for '${objName}' with value '${value}'`);
    try {
        if (stateAttr[name] && stateAttr[name].blacklist == true) {
            adapter.log.silly(`Name '${name}' on blacklist. Skip!`);
            return;
        }
        // Try to get details from state lib, if not use defaults. throw warning is states is not known in attribute list
        const common = {};
        common.modify = {};
        if (!stateAttr[name]) {
            let newWarnMessage = `State attribute definition missing for '${name}' with value '${value}' and type of value '${typeof (value)}'`;
            if (warnMessages[name] == undefined) {
                warnMessages[name] = newWarnMessage;
                // Send information to Sentry
                sendSentry(newWarnMessage);
                adapter.log.silly('Message sent for ' + warnMessages[name]);
            }
        }
        common.name = stateAttr[name] !== undefined ? stateAttr[name].name || name : name;
        common.type = stateAttr[name] !== undefined ? stateAttr[name].type || typeof (value) : typeof (value);
        common.role = stateAttr[name] !== undefined ? stateAttr[name].role || 'state' : 'state';
        common.read = true;
        common.unit = stateAttr[name] !== undefined ? stateAttr[name].unit || '' : '';
        common.write = stateAttr[name] !== undefined ? stateAttr[name].write || false : false;
        common.states = stateAttr[name] !== undefined ? stateAttr[name].states || '' : '';
        common.modify = stateAttr[name] !== undefined ? stateAttr[name].modify || '' : '';
        adapter.log.silly(`MODIFY to ${name}: ${JSON.stringify(common.modify)}`);

        if ((!adapter.createdStatesDetails[objName])
            || (adapter.createdStatesDetails[objName]
                && (
                    common.name !== adapter.createdStatesDetails[objName].name
                    || common.type !== adapter.createdStatesDetails[objName].type
                    || common.role !== adapter.createdStatesDetails[objName].role
                    || common.read !== adapter.createdStatesDetails[objName].read
                    || common.unit !== adapter.createdStatesDetails[objName].unit
                    || common.write !== adapter.createdStatesDetails[objName].write
                    || common.states !== adapter.createdStatesDetails[objName].states
                    || common.modify !== adapter.createdStatesDetails[objName].modify
                )
            )) {
            adapter.log.silly(`Attribute definition changed for '${objName}' with '${JSON.stringify(common)}'`);
            await adapter.extendObjectAsync(objName, {
                type: 'state',
                common
            });

        } else {
            // console.log(`Nothing changed do not update object`);
        }

        // Store current object definition to memory
        adapter.createdStatesDetails[objName] = common;

        // Set value to state
        if (value !== undefined) {
            //adapter.log.info('Common.mofiy: ' + JSON.stringify(common.modify));
            if (common.modify != '' && typeof common.modify == 'string') {
                adapter.log.silly(`Value "${value}" for name "${objName}" before function modify with method "${common.modify}"`);
                value = modify(common.modify, value);
                adapter.log.silly(`Value "${value}" for name "${objName}" after function modify with method "${common.modify}"`);
            } else if (typeof common.modify == 'object') {
                for (let i of common.modify) {
                    adapter.log.silly(`Value "${value}" for name "${objName}" before function modify with method "${i}"`);
                    value = modify(i, value);
                    adapter.log.silly(`Value "${value}" for name "${objName}" after function modify with method "${i}"`);
                }
            }
            adapter.log.silly(`State "${objName}" set with value "${value}" and expire time "${expire}"`);
            await adapter.setStateAsync(objName, {
                val: value,
                ack: true,
                expire: expire
            });
        }

        // Timer to set online state to FALSE when not updated
        if (name === 'online' && adapter.executioninterval != undefined) {
            // Clear running timer
            if (stateExpire[objName]) {
                clearTimeout(stateExpire[objName]);
                stateExpire[objName] = null;
            }

            // timer
            stateExpire[objName] = setTimeout(async () => {
                await adapter.setStateAsync(objName, {
                    val: false,
                    ack: true,
                });
                adapter.log.info('Online state expired for ' + objName);
            }, adapter.executioninterval * 1000 + 5000);
            adapter.log.silly('Expire time set for state : ' + name + ' with time in seconds : ' + (adapter.executioninterval + 5));
        }

        // Subscribe on state changes if writable
        common.write && adapter.subscribeStates(objName);

    } catch (error) {
        error = `Error in function stateSetCreate(): ${error}`;
        adapter.log.error(error);
    }
}

/**
 * Handles error mesages for log and Sentry
 * @param {string} msg Error message
 */
function sendSentry(msg) {
    try {
        if (adapter.log.level != 'debug' && adapter.log.level != 'silly') {
            if (adapter.supportsFeature && adapter.supportsFeature('PLUGINS')) {
                const sentryInstance = adapter.getPluginInstance('sentry');
                if (sentryInstance) {
                    sentryInstance.getSentryObject().captureException(msg);
                    adapter.log.info(`Error catched and send to Sentry, thank you collaborating! Error: ${msg}`);
                } else {
                    adapter.log.warn(`Sentry disabled, error catched: ${msg}`);
                    console.error(`Sentry disabled, error catched: ${msg}`);
                }
            } else {
                adapter.log.warn(`Sentry disabled, error catched: ${msg}`);
            }
        }
        else {
            adapter.log.warn(`Sentry disabled (debug mode), error catched: ${msg}`);
        }
    } catch (error) {
        adapter.log.error(`Error in function sendSentry(): ${error}`);
    }
}

/**
 * Handles the expire if a value is no longer responsed in the API call
 * @param {string} searchpattern defines wich states should be checked, e.g. '*' or 'xyz.abcd.*' or 'xyz.*ab*.fgh'
 */
async function checkExpire(searchpattern) {
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

        let states = await adapter.getStatesAsync(searchpattern);
        for (let idS in states) {
            state = await adapter.getStateAsync(idS);
            adapter.log.silly(idS + ': ' + state);
            if (state && state.val != null) {
                let stateTs = state.ts;
                let dif = onlineTs - stateTs;
                adapter.log.silly(`${idS}: ${stateTs} | ${onlineTs} | ${dif}`);
                if ((onlineTs - stateTs) > 0) {
                    await adapter.setStateAsync(idS, null, true);
                    adapter.log.silly(`Set state ${idS} to null`);
                }
            }
        }
    } catch (error) {
        error = `Error in function checkExpire(): ${error}`;
        adapter.log.error(error);
        sendSentry(error);
    }
}

/**
 * Sets state online to true as reference for outdated states
 */
async function setLastStartTime() {
    await stateSetCreate('online', 'online', true);
}

/**
 * Deletes device + channels + states
 * @param {string} devicename devicename (not the whole path) to be deleted
 */
async function deleteEverything(devicename) {
    await adapter.deleteDeviceAsync(devicename);
    let states = await adapter.getStatesAsync(`${devicename}.*`);
    for (const idS in states) {
        await adapter.delObjectAsync(idS);
    }
}

module.exports = {
    TraverseJson: TraverseJson,
    stateSetCreate: stateSetCreate,
    checkExpire: checkExpire,
    init: init,
    setLastStartTime: setLastStartTime,
    deleteEverything: deleteEverything,
    version: version,
    path: path
};
