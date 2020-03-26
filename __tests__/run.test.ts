import { SNS } from 'aws-sdk'
import { Context } from '@actions/github/lib/context'
import { Core, createSNSClient, Deps, Environment, loadEvent, ReadFileAsyncFn } from '../src/api'

import run from '../src/run'

describe('Run function', () => {

    let core: Core
    let createSNSClient: createSNSClient
    let sns: SNS
    let loadEvent: loadEvent
    let readFileAsync: ReadFileAsyncFn
    let inputs: Record<string, any>
    let env: Environment
    let context: Context
    let deps: Deps
    const MessageId = 'foobar'

    beforeEach(() => {
        sns = {
            publish: jest.fn(() => ({
                promise: jest.fn(() => Promise.resolve({ MessageId }))
            })),
        } as any as SNS
        createSNSClient = jest.fn(() => sns)
        loadEvent = jest.fn(() => Promise.resolve({
            isCustomEvent: false,
            eventName: 'push',
            event: { foo: 'bar' },
        }))
        readFileAsync = jest.fn(() => Promise.resolve('{}'))
        inputs = {
            awsAccessKeyId: 'abc123',
            awsSecretAccessKey: 'abc123',
            snsTopic: 'aws::sns::ci',
        }
        env = {
            GITHUB_EVENT_PATH: 'refs/head/master',
            GITHUB_HEAD_REF: 'refs/head/master',
            GITHUB_BASE_REF: 'refs/head/DEV-1234-foobar',
            GITHUB_RUN_ID: '42',
            GITHUB_RUN_NUMBER: '12',
            GITHUB_ACTOR: 'rclayton-the-terrible',
        }
        context = {
            repo: {
                owner: 'peachjar',
                repo: 'peachjar-svc-auth',
            },
            sha: 'abcd1234567890',
            ref: 'refs/head/master',
        } as any as Context
        core = {
            getInput: jest.fn((key: string) => inputs[key]),
            setOutput: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            setFailed: jest.fn()
        }
        deps = {
            createSNSClient,
            readFileAsync,
            loadEvent,
            core,
        }
    })

    describe('when the [awsAccessKeyId] is not supplied', () => {
        beforeEach(() => {
            inputs.awsAccessKeyId = undefined
        })

        it('should fail the action', async () => {
            await run(deps, context, env)
            expect(core.setFailed).toHaveBeenCalled()
        })
    })

    describe('when the [awsSecretAccessKey] is not supplied', () => {
        beforeEach(() => {
            inputs.awsSecretAccessKey = undefined
        })

        it('should fail the action', async () => {
            await run(deps, context, env)
            expect(core.setFailed).toHaveBeenCalled()
        })
    })

    describe('when the [snsTopic] is not supplied', () => {
        beforeEach(() => {
            inputs.snsTopic = undefined
        })

        it('should fail the action', async () => {
            await run(deps, context, env)
            expect(core.setFailed).toHaveBeenCalled()
        })
    })

    describe('when the eventName and event is not specified', () => {
        it('should default to "github"', async () => {
            await run(deps, context, env)
            expect(core.setFailed).not.toHaveBeenCalled()
            const [payload] = (sns.publish as jest.Mock).mock.calls[0]
            expect(payload).toMatchObject({
                TopicArn: 'aws::sns::ci',
                Message: expect.anything()
            })
            expect(JSON.parse(payload.Message)).toMatchObject({
                id: expect.anything(),
                // Repo in which the event occurred
                repository: {
                    owner: 'peachjar',
                    repo: 'peachjar-svc-auth',
                },
                // Commit information
                git: {
                    sha: 'abcd1234567890',
                    sha7: 'abcd123',
                    ref: 'refs/head/master',
                    headRef: 'refs/head/master',
                    baseRef: 'refs/head/DEV-1234-foobar',
                },
                // Github Action metadata
                run: {
                    id: '42',
                    number: '12',
                    actor: 'rclayton-the-terrible',
                },
                // action that invoked the workflow, or custom value
                type: 'github',
                eventName: 'push',
                event: { foo: 'bar' },
            })
        })
    })

    describe('when the [event] is specified', () => {

        beforeEach(() => {
            inputs.eventName = 'helloworld'
            inputs.event = '{"hello":"world"}'
            deps.loadEvent = jest.fn(() => Promise.resolve({
                isCustomEvent: true,
                eventName: 'helloworld',
                event: { hello: 'world' },
            }))
        })

        it('should use "custom"', async () => {
            await run(deps, context, env)
            expect(core.setFailed).not.toHaveBeenCalled()
            const [payload] = (sns.publish as jest.Mock).mock.calls[0]
            expect(payload).toMatchObject({
                TopicArn: 'aws::sns::ci',
                Message: expect.anything()
            })
            expect(JSON.parse(payload.Message)).toMatchObject({
                id: expect.anything(),
                // Repo in which the event occurred
                repository: {
                    owner: 'peachjar',
                    repo: 'peachjar-svc-auth',
                },
                // Commit information
                git: {
                    sha: 'abcd1234567890',
                    sha7: 'abcd123',
                    ref: 'refs/head/master',
                    headRef: 'refs/head/master',
                    baseRef: 'refs/head/DEV-1234-foobar',
                },
                // Github Action metadata
                run: {
                    id: '42',
                    number: '12',
                    actor: 'rclayton-the-terrible',
                },
                // action that invoked the workflow, or custom value
                type: 'custom',
                eventName: 'helloworld',
                event: { hello: 'world' },
            })
        })
    })

    describe('when an error is thrown by a component', () => {
        beforeEach(() => {
            deps.loadEvent = jest.fn(() => { throw new Error('Kaboom!') })
        })

        it('should be caught by the function and the workflow failed', async () => {
            await run(deps, context, env)
            expect(core.setFailed).toHaveBeenCalled()
        })
    })
})
