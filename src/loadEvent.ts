import { Core, ReadFileAsyncFn, Environment, EventData } from './api'

export default async function loadEvent(
    core: Core,
    readFileAsync: ReadFileAsyncFn,
    env: Environment
): Promise<EventData> {

    let isCustomEvent = false
    let eventBodyString: string | undefined = core.getInput('event')

    if (!eventBodyString) {
        eventBodyString = await readFileAsync(env.GITHUB_EVENT_PATH, 'utf-8')
    } else {
        isCustomEvent = true
    }

    const eventName = core.getInput('eventName') || env.GITHUB_EVENT_NAME || 'unknown'

    return {
        isCustomEvent,
        eventName,
        event: JSON.parse(eventBodyString!),
    }
}
