/**
 * ************************************************************
 * *************** state attribute template 0.2 ***************
 * *** state attribute template 0.2 by HGlab01 & DutchmanNL ***
 * ************************************************************
 * Object definitions can contain these elements to be called by stateSetCreate function, if not set default values are used
 'Cancel current printing': {			// id of state (name) submitted by stateSetCreate function
		root: '_Info',						// {default: NotUsed} Upper channel root
		rootName: 'Device Info channel,		// {default: NotUsed} Upper channel name
		name: 'Name of state',				// {default: same as id} Name definition for object
		type: >typeof (value)<,				// {default: typeof (value)} type of value automatically detected
		read: true,							// {default: true} Name defition for object
		write: true,						// {default: false} Name defition for object
		role: 'indicator.info',				// {default: state} Role as defined by https://github.com/ioBroker/ioBroker/blob/master/doc/STATE_ROLES.md
		modify: ''							// {default: ''} see below
	},
 */

/**
 * Defines supported methods for element modify which can be used in stateAttr.js
 * In addition: 'cumstom: YOUR CALCULATION' allows any calculation, where 'value' is the input parameter.
 * Example: 
 * modify: 'custom: value + 1' --> add 1 to the json-input
 * 
 * Examples for usage of existing methods:
 * modify: [method.msinkmh, method.roundOneDigit] --> defined as array --> converts from m/s to km/h first, than it is rounded by 2 digits
 * modify: method.upperCase --> no array needed as there is only one action; this uppercases the value
 */
const method = {};
method.roundOneDigit = 'roundOneDigit';
method.roundTwoDigit = 'roundTwoDigit';
method.roundThreeDigit = 'roundThreeDigit';
method.upperCase = 'upperCase';
method.lowerCase = 'lowerCase';
method.ucFirst = 'ucFirst';
method.msinkmh = 'm/s in km/h';
method.kmhinms = 'km/h in m/s';
/************************************************************************/


/**
 * state attribute definitions
 */
const stateAttrb = {
	'NAMEOFTHESTATE1': {
		name: 'READABLE NAME/DESCRIPTION',
		type: 'number|string|array|boolean...',
		read: true|false,
		write: true|false,
		role: 'value',
		unit: 's|°|%...',
		modify: [method.msinkmh, method.roundTwoDigit]
	},
	'NAMEOFTHESTATE2': {
		name: 'READABLE NAME/DESCRIPTION',
		type: 'number|string|array|boolean...',
		read: true|false,
		write: true|false,
		role: 'vale',
		unit: 's|°|%...',
		modify: 'customer: (value+1)*2'
	},
	'NAMEOFTHESTATE3': {
		name: 'READABLE NAME/DESCRIPTION',
		type: 'number|string|array|boolean...',
		read: true|false,
		write: true|false,
		role: 'vale',
		unit: 's|°|%...'
	}
};

module.exports = stateAttrb;
