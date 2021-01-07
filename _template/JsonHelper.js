// Classification of all state attributes possible
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
