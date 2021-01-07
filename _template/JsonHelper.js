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
		round_1: true,						// {default: NotUsed} Executed rounding function to 1 digit
		round_2: true,						// {default: NotUsed} Executed rounding function to 1 digit
		round_3: true,						// {default: NotUsed} Executed rounding function to 1 digit
	},
 */

/**
 * state attribute definitions
 */
const stateAttrb = {
	'NAMEOFTHESTATE1': {
		name: 'READABLE NAME/DESCRIPTION',
		type: 'number|string|array|boolean...',
		read: true|false,
		write: true|false,
		role: '',  //https://github.com/ioBroker/ioBroker/blob/master/doc/STATE_ROLES.md
		unit: 's|°|%...'
	},
	'NAMEOFTHESTATE2': {
		name: 'READABLE NAME/DESCRIPTION',
		type: 'number|string|array|boolean...',
		read: true|false,
		write: true|false,
		role: '',  //https://github.com/ioBroker/ioBroker/blob/master/doc/STATE_ROLES.md
		unit: 's|°|%...'	}
};

module.exports = stateAttrb;
