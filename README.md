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


Add line `jsonExplorer.init(this, stateAttr);` to the adapter constructor, where `this` is your adapter class object.  

## How to use
```
/**
 * Traverses the json-object and provides all information for creating/updating states.
 * @param {object} jObject JSON object to be added as states.
 * @param {string | null} [parent=null] Defines the parent object in the state tree.
 * @param {boolean} [replaceName=false] If true, uses the 'name' property from a child object as the name for the structure element (channel).
 * @param {boolean} [replaceID=false] If true, uses the 'id' property from a child object as the ID for the structure element (channel).
 * @param {number} [level=0] The current depth in the JSON structure, used to determine object type (0: device, 1: channel, >1: folder).
 */
traverseJson(jObject, parent, replaceName, replaceID, level)
```
### Expire management (optional)
```
await jsonExplorer.setLastStartTime() //set start time to check afterwards for outdated states
do your code
await jsonExplorer.traverseJson(jObject, parent, replaceName, replaceID, level)
do your code after states are set
await jsonExplorer.checkExpire('*') //check all states if it is expired and set to null
await jsonExplorer.deleteObjectsWithNull('*') //optional: all states with null can be deleted
```

### Reference implementation
https://github.com/HGlab01/ioBroker.fuelpricemonitor

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### __WORK IN PROGRESS__
-->
### 0.2.0-alpha.1 (2025-09-24)
* (HGlab01) folders (level>1) are created in addition to devices (level==0) & channels (level==1)
* (HGlab01) refactorings
* (HGlab01) remove deprecated TraverseJson() function

### 0.1.16 (2024-07-04)
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
