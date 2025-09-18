
const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

// The module to test
const jsonExplorer = require(path.join(process.cwd(), 'jsonExplorer.js'));

describe('jsonExplorer.js', () => {
    let mockAdapter;
    let stateAttr;
    let clock;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
        // Reset mocks and adapter before each test
        mockAdapter = {
            FORBIDDEN_CHARS: /[\][*,;'"`<>?]/g,
            log: {
                silly: sinon.spy(),
                debug: sinon.spy(),
                info: sinon.spy(),
                warn: sinon.spy(),
                error: sinon.spy(),
            },
            setObjectAsync: sinon.stub().resolves(),
            extendObjectAsync: sinon.stub().resolves(),
            setStateAsync: sinon.stub().resolves(),
            getObjectAsync: sinon.stub().resolves(null),
            getStateAsync: sinon.stub().resolves(null),
            getStatesAsync: sinon.stub().resolves({}),
            delObjectAsync: sinon.stub().resolves(),
            subscribeStates: sinon.spy(),
            supportsFeature: sinon.stub().returns(true),
            getPluginInstance: sinon.stub(),
            setTimeout: (callback, ms) => setTimeout(callback, ms),
        };

        stateAttr = {
            temperature: {
                name: 'Temperature',
                type: 'number',
                role: 'value.temperature',
                unit: '°C',
                write: false,
            },
            mode: {
                name: 'Operating Mode',
                type: 'string',
                role: 'state',
                write: true,
            },
            power: {
                name: 'Power',
                type: 'boolean',
                role: 'switch.power',
                write: true,
                modify: ['TOFLOAT', 'multiply(1)'] // example chain
            },
            blacklisted: {
                blacklist: true,
            },
            online: {
                name: 'Online',
                type: 'boolean',
                role: 'indicator.reachable'
            }
        };

        // Mock fs
        sinon.stub(fs, 'writeFileSync');
        sinon.stub(fs, 'readFileSync').throws({ code: 'ENOENT' }); // Default to file not found

        // Initialize the library with the mock adapter
        jsonExplorer.init(mockAdapter, stateAttr);
    });

    afterEach(() => {
        clock.restore();
        sinon.restore();
    });

    describe('init()', () => {
        it('should initialize adapter, stateAttr, and other properties', () => {
            // init is called in beforeEach, so we just check the results
            expect(mockAdapter.createdStatesDetails).to.deep.equal({});
            expect(mockAdapter.subscribedStates).to.be.an.instanceOf(Set);
            expect(mockAdapter.subscribedStates.size).to.equal(0);
            expect(fs.readFileSync.calledOnce).to.be.true;
        });
    });

    describe('traverseJson()', () => {
        it('should traverse a simple JSON object and create states', async () => {
            const jObject = {
                temp: 23.5,
                humidity: 55,
                active: true,
            };
            jsonExplorer.traverseJson(jObject, 'device1');

            await clock.runAllAsync();

            expect(mockAdapter.setObjectAsync.calledWith('device1')).to.be.true;
            expect(mockAdapter.extendObjectAsync.callCount).to.equal(3);
            expect(mockAdapter.setStateAsync.callCount).to.equal(3);
            expect(mockAdapter.setStateAsync.calledWith('device1.temp', { val: 23.5, ack: true })).to.be.true;
            expect(mockAdapter.setStateAsync.calledWith('device1.humidity', { val: 55, ack: true })).to.be.true;
            expect(mockAdapter.setStateAsync.calledWith('device1.active', { val: true, ack: true })).to.be.true;
        });

        it('should handle nested objects', async () => {
            const jObject = {
                climate: {
                    temperature: 21,
                    fan: 'auto',
                },
            };
            jsonExplorer.traverseJson(jObject, 'ac');

            await clock.runAllAsync();

            expect(mockAdapter.setObjectAsync.calledWith('ac')).to.be.true;
            expect(mockAdapter.setObjectAsync.calledWith('ac.climate')).to.be.true;
            expect(mockAdapter.setStateAsync.calledWith('ac.climate.temperature', { val: 21, ack: true })).to.be.true;
            expect(mockAdapter.setStateAsync.calledWith('ac.climate.fan', { val: 'auto', ack: true })).to.be.true;
        });

        it('should handle arrays of objects by traversing each item', async () => {
            const jObject = {
                sensors: [
                    { name: 'sensor1', value: 100 },
                    { name: 'sensor2', value: 200 },
                ],
            };
            jsonExplorer.traverseJson(jObject, 'room');

            await clock.runAllAsync();

            expect(mockAdapter.setObjectAsync.calledWith('room.sensors.0')).to.be.true;
            expect(mockAdapter.setObjectAsync.calledWith('room.sensors.1')).to.be.true;
            expect(mockAdapter.setStateAsync.calledWith('room.sensors.0.value', { val: 100, ack: true })).to.be.true;
            expect(mockAdapter.setStateAsync.calledWith('room.sensors.1.value', { val: 200, ack: true })).to.be.true;
        });

        it('should handle arrays of primitives by creating a single state', async () => {
            const jObject = {
                tags: ['alpha', 'beta', 'gamma'],
            };
            jsonExplorer.traverseJson(jObject, 'device');

            await clock.runAllAsync();

            expect(mockAdapter.setStateAsync.calledOnce).to.be.true;
            expect(mockAdapter.setStateAsync.calledWith('device.tags', { val: JSON.stringify(['alpha', 'beta', 'gamma']), ack: true })).to.be.true;
        });

        it('should use replaceName and replaceID options', async () => {
            const jObject = {
                deviceInfo: {
                    id: 'unique-device-id',
                    name: 'My Awesome Device',
                    status: 'ok'
                }
            };
            jsonExplorer.traverseJson(jObject, 'root', true, true);

            await clock.runAllAsync();

            const setObjectCall = mockAdapter.setObjectAsync.getCall(1).args;
            expect(setObjectCall[0]).to.equal('root.unique-device-id');
            expect(setObjectCall[1].common.name).to.equal('My Awesome Device');
        });

        it('should sanitize forbidden characters in keys and parents', async () => {
            const jObject = {
                'invalid*key': 'value'
            };
            jsonExplorer.traverseJson(jObject, 'invalid?parent');

            await clock.runAllAsync();

            expect(mockAdapter.setObjectAsync.calledWith('invalid_parent')).to.be.true;
            expect(mockAdapter.setStateAsync.calledWith('invalid_parent.invalid_key')).to.be.true;
        });
    });

    describe('modify()', () => {
        // This function is not exported, but it's called by stateSetCreate.
        it('should apply modifications from state attributes', async () => {
            await jsonExplorer.stateSetCreate('test.power', 'power', 1);
            expect(mockAdapter.setStateAsync.calledWith('test.power', { val: 1, ack: true })).to.be.true;
        });

        it('should round a value', async () => {
            stateAttr.rounded = { modify: 'round(2)' };
            await jsonExplorer.stateSetCreate('test.rounded', 'rounded', 3.14159);
            expect(mockAdapter.setStateAsync.calledWith('test.rounded', { val: 3.14, ack: true })).to.be.true;
        });

        it('should multiply a value', async () => {
            stateAttr.multiplied = { modify: 'multiply(10)' };
            await jsonExplorer.stateSetCreate('test.multiplied', 'multiplied', 5);
            expect(mockAdapter.setStateAsync.calledWith('test.multiplied', { val: 50, ack: true })).to.be.true;
        });

        it('should convert to uppercase', async () => {
            stateAttr.upper = { modify: 'UPPERCASE' };
            await jsonExplorer.stateSetCreate('test.upper', 'upper', 'hello');
            expect(mockAdapter.setStateAsync.calledWith('test.upper', { val: 'HELLO', ack: true })).to.be.true;
        });
    });

    describe('stateSetCreate()', () => {
        it('should create a new state with attributes from stateAttr', async () => {
            await jsonExplorer.stateSetCreate('device.temp', 'temperature', 25);

            const extendObjectCall = mockAdapter.extendObjectAsync.getCall(0).args;
            expect(extendObjectCall[0]).to.equal('device.temp');
            expect(extendObjectCall[1].common).to.deep.include({
                name: 'Temperature',
                type: 'number',
                role: 'value.temperature',
                unit: '°C',
                write: false,
            });
            expect(mockAdapter.setStateAsync.calledWith('device.temp', { val: 25, ack: true })).to.be.true;
        });

        it('should not create a state if it is on the blacklist', async () => {
            await jsonExplorer.stateSetCreate('device.bl', 'blacklisted', 'some-value');
            expect(mockAdapter.extendObjectAsync.called).to.be.false;
            expect(mockAdapter.setStateAsync.called).to.be.false;
        });

        it('should log a warning and send to Sentry for missing state attributes', async () => {
            const mockSentry = {
                getSentryObject: sinon.stub().returns({
                    captureMessage: sinon.spy(),
                    withScope: sinon.spy(callback => {
                        const scope = { setLevel: sinon.spy(), setExtra: sinon.spy() };
                        callback(scope);
                    }),
                }),
            };
            mockAdapter.getPluginInstance.withArgs('sentry').returns(mockSentry);

            await jsonExplorer.stateSetCreate('device.unknown', 'unknown_state', 'value');

            expect(mockAdapter.log.silly.calledWith(sinon.match(/Warning message sent for 'unknown_state'/))).to.be.true;
            expect(fs.writeFileSync.calledOnce).to.be.true;
            expect(mockSentry.getSentryObject().withScope.called).to.be.true;
        });

        it('should update an existing object definition if it has changed', async () => {
            const existingObject = {
                common: {
                    name: 'Old Name',
                    type: 'string', // different type
                    role: 'state',
                }
            };
            mockAdapter.getObjectAsync.withArgs('device.temp').resolves(existingObject);

            await jsonExplorer.stateSetCreate('device.temp', 'temperature', 25);

            expect(mockAdapter.extendObjectAsync.calledOnce).to.be.true;
            const extendObjectCall = mockAdapter.extendObjectAsync.getCall(0).args;
            expect(extendObjectCall[1].common.type).to.equal('number');
        });

        it('should not update an existing object definition if it is the same', async () => {
            const existingObject = {
                common: {
                    name: 'Temperature',
                    type: 'number',
                    role: 'value.temperature',
                    read: true,
                    write: false,
                    unit: '°C',
                    states: undefined,
                    modify: '',
                }
            };
            mockAdapter.getObjectAsync.withArgs('device.temp').resolves(existingObject);

            await jsonExplorer.stateSetCreate('device.temp', 'temperature', 25);

            expect(mockAdapter.extendObjectAsync.called).to.be.false;
        });

        it('should subscribe to a state if it is writable', async () => {
            await jsonExplorer.stateSetCreate('device.opmode', 'mode', 'auto');
            expect(mockAdapter.subscribeStates.calledWith('device.opmode')).to.be.true;
            expect(mockAdapter.subscribedStates.has('device.opmode')).to.be.true;
        });

        it('should not subscribe to a state again if already subscribed', async () => {
            await jsonExplorer.stateSetCreate('device.opmode', 'mode', 'auto');
            expect(mockAdapter.subscribeStates.callCount).to.equal(1);

            await jsonExplorer.stateSetCreate('device.opmode', 'mode', 'manual');
            expect(mockAdapter.subscribeStates.callCount).to.equal(1); // Should not be called again
        });

        it('should set an expire timer for the "online" state', async () => {
            mockAdapter.executioninterval = 10; // 10s
            jsonExplorer.init(mockAdapter, stateAttr); // re-init with new interval

            await jsonExplorer.stateSetCreate('device.online', 'online', true);

            expect(mockAdapter.setStateAsync.calledWith('device.online', { val: true, ack: true })).to.be.true;

            // Advance time past the expiration
            await clock.tickAsync(10 * 1000 + 5000 + 1);

            expect(mockAdapter.setStateAsync.calledWith('device.online', { val: false, ack: true })).to.be.true;
        });
    });

    describe('deleteEverything()', () => {
        it('should call delObjectAsync with recursive option', async () => {
            await jsonExplorer.deleteEverything('myDevice');
            expect(mockAdapter.delObjectAsync.calledOnceWith('myDevice', { recursive: true })).to.be.true;
        });

        it('should do nothing if recursive delete is not supported', async () => {
            mockAdapter.supportsFeature.withArgs('ADAPTER_DEL_OBJECT_RECURSIVE').returns(false);
            await jsonExplorer.deleteEverything('myDevice');
            expect(mockAdapter.delObjectAsync.called).to.be.false;
        });
    });
});