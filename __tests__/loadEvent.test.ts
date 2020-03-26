import { Core, Environment, ReadFileAsyncFn } from '../src/api'

import loadEvent from '../src/loadEvent'

describe('Load Event function', () => {

    let core: Core
    let readFileAsync: ReadFileAsyncFn
    let env: Environment
    let inputs: Record<string, any>

    beforeEach(() => {
        inputs = {
            awsAccessKeyId: 'abc123',
            awsSecretAccessKey: 'abc123',
            snsTopic: 'aws::sns::ci',
        }
        core = {
            getInput: jest.fn((key: string) => inputs[key]),
            setOutput: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            setFailed: jest.fn()
        }
        env = {
            GITHUB_EVENT_NAME: 'push',
            GITHUB_EVENT_PATH: '/home/action/workflow.json',
        }
        readFileAsync = jest.fn(() => Promise.resolve('{"foo":"bar"}'))
    })

    describe('when the event is supplied in the input', () => {
        beforeEach(() => {
            inputs.eventName = 'helloworld'
            inputs.event = '{"hello":"world"}'
        })

        it('should use the supplied event as the payload', async () => {
            const eventData = await loadEvent(core, readFileAsync, env)
            expect(eventData).toMatchObject({
                isCustomEvent: true,
                eventName: 'helloworld',
                event: { hello: 'world' },
            })
        })
    })

    describe('when the event is not supplied', () => {
        it('should read the event from the workflow file', async () => {
            const eventData = await loadEvent(core, readFileAsync, env)
            expect(eventData).toMatchObject({
                isCustomEvent: false,
                eventName: 'push',
                event: { foo: 'bar' },
            })
        })
    })
})
