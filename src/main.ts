import * as core from '@actions/core'

import { readFile } from 'fs'
import { promisify } from 'util'
import { context } from '@actions/github'
import { Environment, Deps } from './api'
import { SNS } from 'aws-sdk'

import loadEvent from './loadEvent'
import run from './run'

const deps: Deps = {
    core,
    loadEvent,
    readFileAsync: promisify(readFile),
    createSNSClient: (
        awsAccessKeyId: string,
        awsSecretAccessKey: string,
        awsRegion: string
    ) => new SNS({
        region: awsRegion,
        credentials: {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
        },
    }),
}

run(deps, context, process.env as Environment)
