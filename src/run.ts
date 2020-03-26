import { v4 as uuid } from 'uuid'
import { Context } from '@actions/github/lib/context'
import { Environment, Deps } from './api'

export default async function run(deps: Deps, context: Context, env: Environment): Promise<void> {

    const { core, createSNSClient, loadEvent, readFileAsync } = deps

    try {
        const awsAccessKeyId = core.getInput('awsAccessKeyId', { required: true })
        const awsSecretAccessKey = core.getInput('awsSecretAccessKey', { required: true })

        if (!awsAccessKeyId || !awsSecretAccessKey) {
            return core.setFailed('AWS credentials are invalid.')
        }

        const snsTopic = core.getInput('snsTopic', { required: true })

        if (!snsTopic) {
            return core.setFailed('SNS Topic is required.')
        }

        const sns = createSNSClient(awsAccessKeyId, awsSecretAccessKey)

        const { isCustomEvent, eventName, event } = await loadEvent(core, readFileAsync, env)

        const payload = {
            id: uuid(),
            // Repo in which the event occurred
            repository: {
                owner: context.repo.owner,
                repo: context.repo.repo,
            },
            // Commit information
            git: {
                sha: context.sha,
                sha7: context.sha.slice(0, 7),
                ref: context.ref,
                headRef: env.GITHUB_HEAD_REF,
                baseRef: env.GITHUB_BASE_REF,
            },
            // Github Action metadata
            run: {
                id: env.GITHUB_RUN_ID,
                number: env.GITHUB_RUN_NUMBER,
                actor: env.GITHUB_ACTOR,
            },
            // action that invoked the workflow, or custom value
            type: isCustomEvent ? 'custom' : 'github',
            eventName,
            event,
        }

        const payloadJson = JSON.stringify(payload)

        core.info(`Event: ${payloadJson}`)

        const result = await sns.publish({ TopicArn: snsTopic, Message: payloadJson }).promise()

        core.info(`Event dispatched: ${result.MessageId}`)

    } catch (error) {

        core.setFailed(error.message)
    }
}
