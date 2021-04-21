# ioBroker JsonExplorer


[![NPM version](http://img.shields.io/npm/v/iobroker-jsonexplorer.svg)](https://www.npmjs.com/package/iobroker-jsonexplorer)
[![Downloads](https://img.shields.io/npm/dm/iobroker-jsonexplorer)](https://www.npmjs.com/package/iobroker-jsonexplorer)
[![Known Vulnerabilities](https://snyk.io/test/github/HGlab01/iobroker-jsonexplorer/badge.svg)](https://snyk.io/test/github/HGlab01/iobroker-jsonexplorer)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FHGlab01%2FioBroker-jsonExplorer.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FHGlab01%2FioBroker-jsonExplorer?ref=badge_shield)
[![Dependency Status](https://status.david-dm.org/gh/hglab01/iobroker-jsonexplorer.svg)](https://david-dm.org/HGlab01/iobroker-jsonexplorer)


## How to prepare
Create file `/lib/stateAttr.js` in your adapter directory based on template `_template/stateAttr.js`and add  
* `const JsonExplorer = require('iobroker-jsonexplorer');`
* `const stateAttr = require(__dirname + '/lib/stateAttr.js'); // Load attribute library`  
in section "Load your modules here"  
Install `iobroker-jsonexplorer` by using `npm i iobroker-jsonexplorer`  


Add line `JsonExplorer.init(this, stateAttr);` to the adapter constructor, where "this" is your adapter class object.  

## How to use
Call `await JsonExplorer.TraverseJson(result, parent, replaceName, replaceID);`  
result: JSON object to be added as states  
parent: name of the parent state; null results in root  
replaceName: true|false; if true, the description of a channel will be replaced by the name of a leaf-state if available (search for a state with id "name")  
replaceID: true|false; if true, the description of a channel will be replaced by the id of a leaf-state if available (search for a state with id "id")

### Expire management (optional)
All states can be monitored and set to NULL if it is not updated in the last run by calling `JsonExplorer.setLastStartTime()` before calling `JsonExplorer.TraverseJson()` and `JsonExplorer.checkExpire('*')` after caling `JsonExplorer.TraverseJson()`

### Reference implementation
https://github.com/HGlab01/ioBroker.fuelpricemonitor

## Changelog
<!-- 
Placeholder for release script, not visible in web/admin interface
	### __WORK IN PROGRESS__
	* (Developer) xxxx
-->

### 0.0.0-18 (2021-04-21)
* (HGlab01) attribute version number added

### 0.0.0-17 (2021-04-17)
* (HGlab01) fix issue in TraverseJson if id is 0

### 0.0.0-16 (2021-04-16)
* (HGlab01) deal with array of objects in the JSON

### 0.0.0-15 (2021-04-14)
* (HGlab01) improve state property handling
* (HGlab01) improve null-value handling

### 0.0.0-14 (2021-04-12)
* (HGlab01) improve device creation

### 0.0.0-13 (2021-03-27)
* (HGlab01) add function deleteEverything()

### 0.0.0-12 (2021-02-22)
* (HGlab01) manage device/channel/state properly
* (HGlab01) log level from debug to silly

### 0.0.0-11 (2021-02-21)
* (HGlab01) improve Sentry handling

### 0.0.0-10 (2021-02-19)
* (HGlab01) activate Sentry

### 0.0.0-9 (2021-02-17)
* (HGlab01) if executioninterval is not set, state 'online' never set to false

### 0.0.0-8 (2021-02-07)
* (DutchmanNL) solve issue for modify value if no definition is present

### 0.0.0-7
* (HGlab01) adjust loglevel

### 0.0.0-6
* (HGlab01) bugfixes
* (HGlab01) improve readability

### 0.0.0-5
* (HGlab01) breaking change!!! rework to more generic modify methods

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

Copyright (c) 2021 HGlab01 & DutchmanNL

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
