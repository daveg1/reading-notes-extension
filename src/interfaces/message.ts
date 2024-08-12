export type Message = DataMessage | LoadingMessage

interface DataMessage {
  type: 'data'
  data: string
}

interface LoadingMessage {
  type: 'loading'
}
