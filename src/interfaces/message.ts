export type Message =
  | StartUpMessage
  | PingMessage
  | LoadingMessage
  | DataMessage

interface StartUpMessage {
  type: 'start-up'
}

interface PingMessage {
  type: 'ping'
}

interface LoadingMessage {
  type: 'loading'
}

interface DataMessage {
  type: 'data'
  data: string
}
