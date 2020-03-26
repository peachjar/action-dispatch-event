import { SNS } from 'aws-sdk'

export type Environment = { [key: string]: string }

export type Core = {
    getInput: (key: string, opts?: { required: boolean }) => string | undefined
    setOutput: (name: string, value: string) => void
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    setFailed: (message: string) => void
    [k: string]: any
}

export type createSNSClient = (awsAccessKeyId: string, awsSecretAccessKey: string) => SNS

export type ReadFileAsyncFn = (path: string, encoding: string) => Promise<string>

export type EventData = {
    isCustomEvent: boolean,
    eventName: string,
    event: any
}

export type loadEvent = (core: Core, readFileAsync: ReadFileAsyncFn, env: Environment) => Promise<EventData>

export type Deps = {
    core: Core,
    createSNSClient: createSNSClient,
    loadEvent: loadEvent,
    readFileAsync: ReadFileAsyncFn,
}
