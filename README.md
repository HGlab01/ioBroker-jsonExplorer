# ioBroker JsonExplorer

## How to prepare
create file /lib/stateAttr.js based on template "_template/stateAttr.js"
add 
    const JsonExplorer = require('iobroker-jsonexplorer');
    const stateAttr = require(`${__dirname}/lib/stateAttr.js`); // Load attribute library
in section "Load your modules here"

Add line
JsonExplorer.init(this, stateAttr);
to the adapter constructor.

## How to use
Call
await JsonHelper.TraverseJson(this, result, parent, true, false);
result: JSON object to be addad as states
parent: name of the parent state; null results in root
replaceName: true|false; if yes, the description of a channel will be replaced by the name of a leaf-state if available
replaceID: true|false; if yes, the description of a channel will be replaced by the id of a leaf-state if available

### Expire management (optional)
All states can be monitored and set to NULL if it is not updated in the last run by calling
"JsonHelper.setLastStartTime(this)" before calling JsonHelper.TraverseJson()
and
"JsonHelper.checkExpire(this, parent)" after caling JsonHelper.TraverseJson()
