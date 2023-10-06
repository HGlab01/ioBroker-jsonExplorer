/**
 * ************************************************************
 * *************** state attribute template  ******************
 * *** state attribute template by HGlab01 & DutchmanNL ***
 * ************************************************************
 * Object definitions can contain these elements to be called by stateSetCreate function, if not set default values are used
 'Cancel current printing': {			// id of state (name) submitted by stateSetCreate function
		root: '_Info',						// {default: NotUsed} Upper channel root
		rootName: 'Device Info channel,		// {default: NotUsed} Upper channel name
		name: 'Name of state',				// {default: same as id} Name definition for object
		type: >typeof (value)<,				// {default: typeof (value)} type of value automatically detected
		read: true,							// {default: true} Name definition for object
		write: true,						// {default: false} Name definition for object
		role: 'indicator.info',				// {default: state} Role as defined by https://github.com/ioBroker/ioBroker/blob/master/doc/STATE_ROLES.md
		modify: ''							// {default: ''} see below
	},
 */

/**
 * Defines supported methods for element modify which can be used in stateAttr.js
 * In addition: 'custom: YOUR CALCULATION' allows any calculation, where 'value' is the input parameter.
 * Example:
 * modify: 'custom: value + 1' --> add 1 to the json-input
 * 
 *  * supported methods (as string): 
 *  - round(number_of_digits as {number})  //integer only
 * 	- multiply(factor as {number})
 *  - divide(factor as {number})
 *  - add(number {number})
 *  - substract(number {number})
 *  - upperCase
 *  - lowerCase
 *  - ucFirst
 *  - toInteger
 *  - toFloat
 * 
 * Examples for usage of embeded methods:
 * modify: ['multiply(3.6)', 'round(2)'] --> defined as array --> multiplied by 3.6 and then the result is rounded by 2 digits
 * modify: 'upperCase' --> no array needed as there is only one action; this uppercases the string
 * 
 */

/**
 * state attribute definitions
 */
const stateAttrb = {
	'NAMEOFTHESTATE1': {
		name: 'READABLE NAME/DESCRIPTION',
		type: 'number|string|array|boolean...',
		read: true | false,
		write: true | false,
		role: 'value',
		unit: 's|°|%...',
		modify: ['multiply(3.6)', 'round(2)']
	},
	'NAMEOFTHESTATE2': {
		name: 'READABLE NAME/DESCRIPTION',
		type: 'number|string|array|boolean...',
		read: true | false,
		write: true | false,
		role: 'vale',
		unit: 's|°|%...',
		modify: 'customer: (value+1)*2+value/2'
	},
	'NAMEOFTHESTATE3': {
		name: 'READABLE NAME/DESCRIPTION',
		type: 'number|string|array|boolean...',
		read: true | false,
		write: true | false,
		role: 'vale',
		unit: 's|°|%...',
		modify: 'upperCase'
	},
	'NAMEOFTHESTATE4': {
		name: 'READABLE NAME/DESCRIPTION',
		type: 'number|string|array|boolean...',
		read: true | false,
		write: true | false,
		role: 'vale',
		unit: 's|°|%...'
	}
};

module.exports = stateAttrb;
