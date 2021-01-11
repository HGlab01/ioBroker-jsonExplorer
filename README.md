# ioBroker JsonExplorer


[![NPM version](http://img.shields.io/npm/v/iobroker-jsonexplorer.svg)](https://www.npmjs.com/package/iobroker-jsonexplorer)
[![Downloads](https://img.shields.io/npm/dm/iobroker-jsonexplorer)](https://www.npmjs.com/package/iobroker-jsonexplorer)
[![Known Vulnerabilities](https://snyk.io/test/github/HGlab01/iobroker-jsonexplorer/badge.svg)](https://snyk.io/test/github/HGlab01/iobroker-jsonexplorer)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FHGlab01%2FioBroker-jsonExplorer.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FHGlab01%2FioBroker-jsonExplorer?ref=badge_shield)
[![Dependency Status](https://status.david-dm.org/gh/hglab01/iobroker-jsonexplorer.svg)](https://david-dm.org/HGlab01/iobroker-jsonexplorer)


## How to prepare
Create file `/lib/stateAttr.js` based on template `_template/stateAttr.js`and add  
* `const JsonExplorer = require('iobroker-jsonexplorer');`
* `const stateAttr = require(__dirname + '/lib/stateAttr.js'); // Load attribute library`  
in section "Load your modules here"  


Add line `JsonExplorer.init(this, stateAttr);` to the adapter constructor.  

## How to use
Call `await JsonExplorer.TraverseJson(result, parent, true, false);`  
result: JSON object to be addad as states  
parent: name of the parent state; null results in root  
replaceName: true|false; if yes, the description of a channel will be replaced by the name of a leaf-state if available  
replaceID: true|false; if yes, the description of a channel will be replaced by the id of a leaf-state if available  


### Expire management (optional)
All states can be monitored and set to NULL if it is not updated in the last run by calling `JsonExplorer.setLastStartTime()` before calling `JsonExplorer.TraverseJson()` and `JsonExplorer.checkExpire(parent)` after caling `JsonExplorer.TraverseJson()`

## Changelog

<!-- 
Placeholder for release script, not visible in web/admin interface
	### __WORK IN PROGRESS__
	* (Developer) xxxx
-->

### __WORK IN PROGRESS__
* 

### 0.0.0-4
* (HGlab01) rename template
* (HGlab01) support generic modify element

### 0.0.0-2
* (DutchmanNL) implement capability to round values 
* (DutchmanNL) add definition explanation to attribute template
* (HGlab01) breaking change!!! adapter object removed from all function signatures within json-explorer; to be adopted by all callers

### 0.0.0-1
* (HGlab01) initial release

## License
MIT License

Copyright (c) 2021 HGlab01 & DutchmanNL <rdrozda@hotmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FHGlab01%2FioBroker-jsonExplorer.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FHGlab01%2FioBroker-jsonExplorer?ref=badge_large)
