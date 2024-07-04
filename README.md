# ioBroker JsonExplorer


[![NPM version](http://img.shields.io/npm/v/iobroker-jsonexplorer.svg)](https://www.npmjs.com/package/iobroker-jsonexplorer)
[![Downloads](https://img.shields.io/npm/dm/iobroker-jsonexplorer)](https://www.npmjs.com/package/iobroker-jsonexplorer)
[![Known Vulnerabilities](https://snyk.io/test/github/HGlab01/iobroker-jsonexplorer/badge.svg)](https://snyk.io/test/github/HGlab01/iobroker-jsonexplorer)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FHGlab01%2FioBroker-jsonExplorer.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FHGlab01%2FioBroker-jsonExplorer?ref=badge_shield)
[![Dependency Status](https://status.david-dm.org/gh/hglab01/iobroker-jsonexplorer.svg)](https://david-dm.org/HGlab01/iobroker-jsonexplorer)


## How to prepare
Create file `/lib/stateAttr.js` in your adapter directory based on template `_template/stateAttr.js`and add  
* `const jsonExplorer = require('iobroker-jsonexplorer');`
* `const stateAttr = require(__dirname + '/lib/stateAttr.js'); // Load attribute library`  
in section "Load your modules here"  
Install `iobroker-jsonexplorer` by using `npm i iobroker-jsonexplorer`  


Add line `jsonExplorer.init(this, stateAttr);` to the adapter constructor, where "this" is your adapter class object.  

## How to use
Call `await JsonExplorer.TraverseJson(result, parent, replaceName, replaceID);`  
result: JSON object to be added as states  
parent: name of the parent state; null results in root  
replaceName: true|false; if true, the description of a channel will be replaced by the name of a leaf-state if available (search for a state with id "name")  
replaceID: true|false; if true, the description of a channel will be replaced by the id of a leaf-state if available (search for a state with id "id")

### Expire management (optional)
All states can be monitored and set to NULL if it is not updated in the last run by calling `jsonExplorer.setLastStartTime()` before calling `jsonExplorer.traverseJson()` and `jsonExplorer.checkExpire('*')` after caling `JsonExplorer.TraverseJson()`

### Reference implementation
https://github.com/HGlab01/ioBroker.fuelpricemonitor

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### __WORK IN PROGRESS__
-->
### 0.1.16-alpha.0 (2024-07-04)
* (HGlab01) fix "deleteDevice" is deprecated and will be removed in js-controller 7
* (HGlab01) add function deleteObjectsWithNull()

### 0.1.15 (2023-12-11)
* (HGlab01) fix coding-typo

### 0.1.14 (2023-10-08)
* (HGlab01) add versionInfo
* (HGlab01) add modify-methods 'toFloat' and 'toInteger'
* (DutchmanNL) couple of code improvements

### 0.1.13 (2023-10-03)
* (HGlab01) fix #113 "Cannot read properties of undefined (reading 'Warning')"

### 0.1.12 (2023-07-03)
* (HGlab01) Improve statename verification

## License
MIT License

Copyright (c) HGlab01 & DutchmanNL

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
