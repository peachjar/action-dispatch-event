<p align="center">
  <a href="https://github.com/peachjar/action-dispatch-event/actions">
    <img
      alt="typescript-action status"
      src="https://github.com/peachjar/action-dispatch-event/workflows/build-test/badge.svg">
  </a>
</p>

# Github Action: Dispatch Event

Sends an event to our CI eventing system.  This is a core building block for synchronizing tools in our environment (notifying users of updates in repos, building cross-repo awareness).

The CI eventing system is Amazon SNS (Simple Notification Service).  This is a gateway for binding listeners in AWS (SQS, Lambda, Webhook, etc.).

This action can be used in two ways:

1.  Dispatch the event that triggered the Github Action (e.g. `push`, `deployment`, `deployment_status`).  The event that triggered the workflow will be the `event` of the event sent to SNS.
2.  Dispatch a custom event.  The context of the workflow (repository, etc.) will be sent in the event.  The invoker will also be allowed to supply a customer `event` which can use Github workflow syntax.

## Event Schema

```typescript
type UUID = string
type GithubEventName = string
type GitEvent = any

type Event = {
  id: UUID,
  // Repo in which the event occurred
  repository: {
    owner: string,
    repo: string,
  },
  // Commit information
  git: {
    sha: string,
    sha7: string,
    ref: string,
    headRef: string,
    baseRef: string,
  },
  // Github Action metadata
  run: {
    id: string,
    number: string,
    actor: string,
  },
  // action that invoked the workflow, or custom value
  type: 'github' | 'custom'
  eventName: GithubEventName | string,
  event: GitEvent | any,
}
```

## Usage

We have two types of events:  Github "trigger" events and "custom".

### Github Trigger Event

Github trigger event:

```
uses: peachjar/action-dispatch-event@v1
with:
  awsAccessKeyId: ${{ secrets.AWS_ACCESS_KEY_ID }}
  awsSecretAccessKey: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  awsRegion: ${{ secrets.AWS_REGION }}
  snsTopic: ${{ secrets.SNS_TOPIC }}
```

### Custom Event

```
uses: peachjar/action-dispatch-event@v1
with:
  awsAccessKeyId: ${{ secrets.AWS_ACCESS_KEY_ID }}
  awsSecretAccessKey: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  awsRegion: ${{ secrets.AWS_REGION }}
  snsTopic: ${{ secrets.SNS_TOPIC }}
  eventName: whatever_you_want_to_call_it
  event: |
    {"json":"encoded","string":true}'
```

Note: Github event names are snake case, so it would be wise if our events are snake case as well.
