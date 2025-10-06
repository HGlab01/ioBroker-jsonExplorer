'use strict';

const path = `${__dirname}`;
const { version } = require('./package.json');
const fs = require('fs');
let stateExpire = {},
    warnMessages = {},
    stateAttr = {};
let adapter; //adapter-object initialized by init(); other functions do not need adapter-object in their signatur

/**
 * @param {object} adapterOrigin Adapter-Class (normally "this")
 * @param {object} stateAttribute check README
 */
function init(adapterOrigin, stateAttribute) {
    readWarnMessages();
    adapter = adapterOrigin;
    adapter.createdStatesDetails = {};
    stateAttr = stateAttribute;
    adapter.subscribedStates = new Set();
}

/**
 * Traverses the json-object and provides all information for creating/updating states.
 * @param {object} jObject JSON object to be added as states.
 * @param {string | null} [parent=null] Defines the parent object in the state tree.
 * @param {boolean} [replaceName=false] If true, uses the 'name' property from a child object as the name for the structure element (channel).
 * @param {boolean} [replaceID=false] If true, uses the 'id' property from a child object as the ID for the structure element (channel).
 * @param {number} [level=0] The current depth in the JSON structure, used to determine object type (0: device, 1: channel, >1: folder).
 */
async function traverseJson(jObject, parent = null, replaceName = false, replaceID = false, level = 0) {
    if (parent) {
        parent = parent.replace(adapter.FORBIDDEN_CHARS, '_');
    }
    try {
        // Create a device/channel/folder for the parent object of this level.
        if (parent) {
            let parentName = '';
            if (replaceName) {
                const object = await adapter.getObjectAsync(parent);
                parentName = jObject.name ?? object?.common?.name ?? '';
            }

            const objectType = getObjectType(level);
            await adapter.setObjectAsync(parent, {
                type: objectType,
                common: { name: parentName },
                native: {},
            });
            level++;
        }

        for (const key in jObject) {
            const currentValue = jObject[key];
            if (currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue)) {
                handleObject(key, currentValue, parent, replaceName, replaceID, level);
            } else if (Array.isArray(currentValue)) {
                handleArray(key, currentValue, parent, replaceName, replaceID, level);
            } else {
                const id = parent ? `${parent}.${key}` : key;
                createLeafState(id, key, currentValue);
            }
        }
    } catch (error) {
        const errorMessage = `Error in function traverseJson(): ${error}`;
        adapter.log.error(errorMessage);
        console.error(errorMessage);
        sendSentry(error);
    }
}

/**
 * Determines the ioBroker object type based on the traversal level.
 * @param {number} level The current depth in the JSON structure.
 * @returns {string} The type of the object ('device', 'channel', or 'folder').
 */
function getObjectType(level) {
    if (level === 0) return 'device';
    if (level === 1) return 'channel';
    return 'folder';
}

/**
 * Creates a leaf state in ioBroker for primitive values or stringified arrays/objects.
 * @param {string} id The ID of the state.
 * @param {string} name The name of the state.
 * @param {any} value The value to set.
 */
function createLeafState(id, name, value) {
    let finalValue = value;
    // Stringify objects/arrays that are not traversed recursively.
    if (finalValue !== null && typeof finalValue === 'object') {
        finalValue = JSON.stringify(finalValue);
    }

    // Avoid creating states for empty stringified arrays.
    if (finalValue !== '[]') {
        adapter.log.silly(`create id '${id}' with value '${finalValue}' and name '${name}'`);
        stateSetCreate(id, name, finalValue);
    }
}

/**
 * Handles the traversal of an object property.
 * @param {string} key The object key.
 * @param {object} currentValue The object value.
 * @param {string|null} parent The parent ID.
 * @param {boolean} replaceName Flag to replace the name.
 * @param {boolean} replaceID Flag to replace the ID.
 * @param {number} level The current traversal level.
 */
function handleObject(key, currentValue, parent, replaceName, replaceID, level) {
    adapter.log.silly(`Traverse object '${key}' with value '${currentValue}' and type '${typeof currentValue}'`);

    let id;
    if (replaceID && currentValue.id != null) {
        id = parent ? `${parent}.${currentValue.id}` : String(currentValue.id);
    } else {
        id = parent ? `${parent}.${key}` : key;
    }
    id = id.replace(adapter.FORBIDDEN_CHARS, '_');

    // Avoid channel creation for empty objects.
    if (Object.keys(currentValue).length > 0) {
        traverseJson(currentValue, id, replaceName, replaceID, level + 1);
    } else {
        adapter.log.silly(`State '${id}' received with empty object, ignore channel creation`);
    }
}

/**
 * Handles the traversal of an array property.
 * @param {string} key The object key.
 * @param {Array} currentValue The array value.
 * @param {string|null} parent The parent ID.
 * @param {boolean} replaceName Flag to replace the name.
 * @param {boolean} replaceID Flag to replace the ID.
 * @param {number} level The current traversal level.
 */
function handleArray(key, currentValue, parent, replaceName, replaceID, level) {
    adapter.log.silly(`Traverse array '${key}' with length ${currentValue.length}`);

    // If array contains objects, traverse each item. Otherwise, store as a single JSON string.
    if (currentValue.some(item => typeof item === 'object' && item !== null)) {
        currentValue.forEach((item, index) => {
            let id;
            const itemKey = String(index); // Default key for array items is the index

            if (typeof item === 'object' && item !== null) {
                // Determine the ID: use 'id' attribute if replaceID is true, otherwise use the index.
                if (replaceID && item.id != null) {
                    // Use the item's 'id' property for the path (e.g., ...devices.RU2948924928)
                    id = parent ? `${parent}.${key}.${item.id}` : `${key}.${item.id}`;
                } else {
                    // Use the array index for the path (e.g., ...devices.0)
                    id = parent ? `${parent}.${key}.${itemKey}` : `${key}.${itemKey}`;
                }
                // Replace forbidden characters in the generated ID
                id = id.replace(adapter.FORBIDDEN_CHARS, '_');

                // Recursive call for non-empty objects
                if (Object.keys(item).length > 0) {
                    traverseJson(item, id, replaceName, replaceID, level + 1);
                } else {
                    adapter.log.silly(`State '${id}' received with empty object, ignore channel creation`);
                }
            } else {
                // Handle primitive values within the array (non-objects)
                id = parent ? `${parent}.${key}.${itemKey}` : `${key}.${itemKey}`;
                createLeafState(id, itemKey, item);
            }
        });
    } else {
        // Array contains only primitive values, store as a single JSON string.
        const id = parent ? `${parent}.${key}` : key;
        createLeafState(id, key, currentValue);
    }
}

/**
 * Analyzes the modify element in stateAttr.js and executes the command.
 * @param {string} method Defines the method to be executed (e.g., "round(2)").
 * @param {string | number} value The value to be modified.
 * @returns {any} The modified value.
 */
function modify(method, value) {
    adapter.log.silly(`Function modify with method "${method}" and value "${value}"`);
    try {
        if (method.startsWith('custom:')) {
            return eval(method.substring(7));
        }

        // Process methods with arguments like "round(2)".
        const match = method.match(/^(\w+)\((.*)\)$/);
        if (match) {
            const operation = match[1].toLowerCase();
            const arg = match[2];

            switch (operation) {
                case 'multiply':
                    return parseFloat(value) * parseFloat(arg);
                case 'divide':
                    return parseFloat(value) / parseFloat(arg);
                case 'round': {
                    const decimals = parseInt(arg, 10);
                    const factor = Math.pow(10, decimals);
                    return Math.round(parseFloat(value) * factor) / factor;
                }
                case 'add':
                    return parseFloat(value) + parseFloat(arg);
                case 'substract': // Note: Typo for "subtract" is kept for compatibility reasons.
                    return parseFloat(value) - parseFloat(arg);
            }
        }

        // Process methods without arguments.
        switch (method.toUpperCase()) {
            case 'UPPERCASE':
                return typeof value === 'string' ? value.toUpperCase() : value;
            case 'LOWERCASE':
                return typeof value === 'string' ? value.toLowerCase() : value;
            case 'UCFIRST':
                if (typeof value !== 'string' || !value) return value;
                return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            case 'TOINTEGER':
                return parseInt(value, 10);
            case 'TOFLOAT':
                return parseFloat(value);
            default:
                return value;
        }
    } catch (error) {
        const eMsg = `Error in function modify for method ${method} and value ${value}: ${error}`;
        adapter.log.error(eMsg);
        console.error(eMsg);
        sendSentry(error);
        return value;
    }
}

/**
 * Saves warning messages to a file.
 * @param {object} warnMessages The warning messages object to save.
 */
function saveWarnMessages(warnMessages) {
    try {
        fs.writeFileSync(`./warnMessages.json`, JSON.stringify(warnMessages), 'utf8');
    } catch (error) {
        adapter.log.error('Error in jsonExplorer at saveWarnMessages: ' + error);
    }
}

/**
 * Reads warning messages from a file and loads them into memory.
 */
function readWarnMessages() {
    try {
        const data = fs.readFileSync(`./warnMessages.json`, 'utf8');
        warnMessages = JSON.parse(data);
    } catch (error) {
        if (error.message && error.message.includes('ENOENT') == false)
            adapter.log.error('Error in jsonExplorer at readWarnMessages: ' + error);
    }
}

/**
 * Sends adapter version information to Sentry if it has changed.
 * @param {string} versionInfo The current version of the adapter.
 */
function sendVersionInfo(versionInfo) {
    let oldVersionInfoSentry = warnMessages['versionInfoSentry'];
    let versionInfoSentry = `Adapter was started in version ${versionInfo}`;
    if (oldVersionInfoSentry != versionInfoSentry) {
        sendSentry(versionInfoSentry, 'info');
        warnMessages['versionInfoSentry'] = versionInfoSentry;
        saveWarnMessages(warnMessages);
    }
}

/**
 * Function to handle state creation
 * proper object definitions
 * rounding of values
 * @param {string} objName ID of the object
 * @param {string} name Name of state (also used for stattAttrlib!)
 * @param {any} value Value of the state
 */
async function stateSetCreate(objName, name, value) {
    adapter.log.silly(`stateSetCreate called for '${objName}' with value '${value}'`);
    try {
        // Get attributes from stateAttr library, or an empty object if not defined.
        const attr = stateAttr[name] || {};

        // If the state is on the blacklist, skip creation.
        if (attr.blacklist === true) {
            adapter.log.silly(`Name '${name}' is on the blacklist. Skipping.`);
            return;
        }

        // Sanitize object name by replacing forbidden characters.
        const originalObjName = objName;
        objName = objName.replace(adapter.FORBIDDEN_CHARS, '_');
        if (originalObjName !== objName) {
            adapter.log.info(`Object name '${originalObjName}' was sanitized to '${objName}'`);
        }

        // If state attribute is missing, log a warning once.
        if (!stateAttr[name]) {
            const newWarnMessage = `State attribute definition missing for '${name}' with value '${value}' (type: ${typeof value})`;
            if (warnMessages[name] === undefined) {
                warnMessages[name] = newWarnMessage;
                saveWarnMessages(warnMessages);
                // Send information to Sentry for monitoring.
                sendSentry(newWarnMessage, 'warn', name);
                adapter.log.silly(`Warning message sent for '${name}'`);
            }
        }

        // Construct the 'common' object for the state definition.
        const common = {
            name: attr.name || name,
            type: attr.type || typeof value,
            role: attr.role || 'state',
            read: true,
            write: !!attr.write, // Ensure boolean value
            modify: attr.modify || '',
            // Conditionally add unit and states if they are defined in attributes.
            ...(attr.unit != null && { unit: attr.unit }),
            ...(attr.states != null && { states: attr.states }),
        };
        adapter.log.silly(`MODIFY to ${name}: ${JSON.stringify(common.modify)}`);

        // Get the existing object definition, from cache or from ioBroker objects DB.
        let existingObjectDefinition = adapter.createdStatesDetails[objName];
        if (!existingObjectDefinition) {
            const obj = await adapter.getObjectAsync(objName);
            existingObjectDefinition = obj ? obj.common : undefined;
        }

        // Compare the new common object with the existing one to avoid unnecessary updates.
        // For objects and arrays (states, modify), a stringify comparison is used.
        const needsUpdate =
            !existingObjectDefinition ||
            common.name !== existingObjectDefinition.name ||
            common.type !== existingObjectDefinition.type ||
            common.role !== existingObjectDefinition.role ||
            common.read !== existingObjectDefinition.read ||
            (common.unit || '') !== (existingObjectDefinition.unit || '') ||
            !!common.write !== !!existingObjectDefinition.write ||
            JSON.stringify(common.states) !== JSON.stringify(existingObjectDefinition.states) ||
            JSON.stringify(common.modify) !== JSON.stringify(existingObjectDefinition.modify);

        if (needsUpdate) {
            adapter.log.silly(
                `Object definition for '${objName}' requires update. New: ${JSON.stringify(
                    common,
                )}, Old: ${JSON.stringify(existingObjectDefinition)}`,
            );
            await adapter.extendObjectAsync(objName, {
                type: 'state',
                common,
            });
        }

        // Cache the new object definition to reduce future getObjectAsync calls.
        adapter.createdStatesDetails[objName] = common;

        // Set the state's value if it's provided.
        if (value !== undefined) {
            let modifiedValue = value;

            // Apply value modifications if defined in attributes.
            if (common.modify) {
                const modifiers = Array.isArray(common.modify) ? common.modify : [common.modify];
                for (const mod of modifiers) {
                    if (mod) {
                        // Ensure modifier is not an empty string
                        adapter.log.silly(
                            `Applying modifier "${mod}" to value "${modifiedValue}" for state "${objName}"`,
                        );
                        modifiedValue = modify(mod, modifiedValue);
                        adapter.log.silly(`Value after modification: "${modifiedValue}"`);
                    }
                }
            }

            adapter.log.silly(`Setting state "${objName}" to "${modifiedValue}"`);
            await adapter.setStateAsync(objName, { val: modifiedValue, ack: true });
        }

        // If the state is 'online', set a timer to mark it as offline if not updated.
        if (name === 'online' && adapter.executioninterval != null) {
            // Clear any existing timer for this state.
            if (stateExpire[objName]) {
                clearTimeout(stateExpire[objName]);
            }

            // Set a new timer.
            const expireTime = adapter.executioninterval * 1000 + 5000;
            stateExpire[objName] = setTimeout(async () => {
                await adapter.setStateAsync(objName, { val: false, ack: true });
                adapter.log.info(`Online state for '${objName}' expired.`);
            }, expireTime);
            adapter.log.silly(`Expire timer set for state '${objName}' in ${expireTime / 1000} seconds.`);
        }

        // Subscribe to state changes if the state is writable.
        //TODO: Subscriben nur einmal! Checken ob bereits subsribed
        subscribeIfNecessary(common.write, objName);
    } catch (error) {
        const errorMessage = `Error in function stateSetCreate() for '${objName}': ${error}`;
        adapter.log.error(errorMessage);
        console.error(errorMessage);
        sendSentry(error);
    }
}

/**
 * Handles error mesages for log and Sentry
 * @param {any} mObject Message object
 * @param {string} mType Message type, can be info,warn and error
 * @param {string|null} missingAttribute Name of the attribute which was not defined
 */
function sendSentry(mObject, mType = 'error', missingAttribute = null) {
    try {
        if (adapter.log.level != 'debug' && adapter.log.level != 'silly') {
            if (mType == 'info') {
                if (adapter.supportsFeature && adapter.supportsFeature('PLUGINS')) {
                    const sentryInstance = adapter.getPluginInstance('sentry');
                    if (sentryInstance) {
                        const Sentry = sentryInstance.getSentryObject();
                        Sentry &&
                            Sentry.withScope(scope => {
                                scope.setLevel('info');
                                Sentry.captureMessage(mObject);
                            });
                    } //else adapter.log.info('Sentry not available/activated');
                } //else adapter.log.info('Sentry not available');
            } else if (mType == 'warn') {
                if (adapter.supportsFeature && adapter.supportsFeature('PLUGINS')) {
                    const sentryInstance = adapter.getPluginInstance('sentry');
                    if (sentryInstance) {
                        const Sentry = sentryInstance.getSentryObject();
                        Sentry &&
                            Sentry.withScope(scope => {
                                scope.setLevel('warning');
                                if (missingAttribute) scope.setExtra('missingAttribute', missingAttribute);
                                Sentry.captureMessage(mObject);
                                adapter.log.info(
                                    `Warning catched and send to Sentry, thank you collaborating! Warn: ${mObject}`,
                                );
                            });
                    } else {
                        adapter.log.warn(`Sentry disabled, error catched: ${mObject}`);
                    }
                } else {
                    adapter.log.warn(`Sentry disabled, error catched: ${mObject}`);
                }
            } else {
                if (adapter.supportsFeature && adapter.supportsFeature('PLUGINS')) {
                    const sentryInstance = adapter.getPluginInstance('sentry');
                    if (sentryInstance) {
                        sentryInstance.getSentryObject()?.captureException(mObject);
                        adapter.log.info(
                            `Error catched and send to Sentry, thank you collaborating! Error: ${mObject}`,
                        );
                    } else {
                        adapter.log.warn(`Sentry disabled, error catched: ${mObject}`);
                    }
                } else {
                    adapter.log.warn(`Sentry disabled, error catched: ${mObject}`);
                }
            }
        } else {
            adapter.log.warn(`Sentry disabled (debug mode), error catched: ${mObject}`);
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
        adapter.log.debug('checkExpire() searchpattern is ' + searchpattern);

        const onlineState = await adapter.getStateAsync('online');

        if (!onlineState || !onlineState.val) {
            adapter.log.error(`Adapter is offline or attribute 'online' not found. Aborting checkExpire...`);
            return;
        }
        const onlineTs = onlineState.ts;
        await sleep(1000);
        const states = await adapter.getStatesAsync(searchpattern);
        for (const idS in states) {
            const state = states[idS];
            if (state && state.val != null) {
                adapter.log.silly(`${idS}: ${state.ts} | ${onlineTs} | ${onlineTs - state.ts}`);
                if (onlineTs > state.ts) {
                    await adapter.setStateAsync(idS, null, true);
                    adapter.log.debug(`checkExpire() sets state ${idS} to null`);
                }
            }
        }
        adapter.log.debug('checkExpire() done');
    } catch (error) {
        const errorMessage = `Error in function checkExpire(): ${error}`;
        adapter.log.error(errorMessage);
        console.error(errorMessage);
        sendSentry(error);
    }
}

/**
 * Sets state online to true as reference for outdated states
 */
async function setLastStartTime() {
    let now = new Date();
    let onlineStateTS = 0;
    let onlineState = await adapter.getStateAsync('online');
    if (onlineState) onlineStateTS = onlineState.ts;
    //just update timestamp if last update is older than 10 seconds
    if (now - onlineStateTS > 10000) {
        await stateSetCreate('online', 'online', true);
    }
}

/**
 * Deletes device + channels + states
 * @param {string} devicename devicename (not the whole path) to be deleted
 */
async function deleteEverything(devicename) {
    if (adapter.supportsFeature && adapter.supportsFeature('ADAPTER_DEL_OBJECT_RECURSIVE')) {
        await adapter.delObjectAsync(devicename, { recursive: true });
    }
}

/**
 * Delete all states with value NULL
 * @param {string} statePath statePath to be checked; e.g. 'marketprice.\*Threshold.\*'
 */
async function deleteObjectsWithNull(statePath) {
    const statesToDelete = await adapter.getStatesAsync(statePath);
    for (const idS in statesToDelete) {
        const state = statesToDelete[idS];
        if (state && state.val == null) {
            adapter.log.debug(`State "${idS}" will be deleted`);
            await adapter.delObjectAsync(idS);
        }
    }
}

/**
 * @param {number} ms
 */
function sleep(ms) {
    return /** @type {Promise<void>} */ (new Promise(resolve => adapter.setTimeout(() => resolve(), ms)));
}

/**
 * Subscribes to a state if it is writable and not already subscribed.
 *
 * @param {boolean} isWritable - Indicates if the state is writable.
 * @param {string} objName - The name of the state to subscribe to.
 */
function subscribeIfNecessary(isWritable, objName) {
    if (isWritable) {
        if (!adapter.subscribedStates.has(objName)) {
            adapter.subscribeStates(objName);
            adapter.subscribedStates.add(objName);
            adapter.log.silly(`Successfully subscribed to state: ${objName}`);
        } else {
            adapter.log.silly(`State already subscribed, skipping: ${objName}`);
        }
    }
}

module.exports = {
    traverseJson: traverseJson,
    stateSetCreate: stateSetCreate,
    checkExpire: checkExpire,
    init: init,
    setLastStartTime: setLastStartTime,
    deleteEverything: deleteEverything,
    version: version,
    path: path,
    sleep: sleep,
    sendVersionInfo: sendVersionInfo,
    deleteObjectsWithNull: deleteObjectsWithNull,
};
