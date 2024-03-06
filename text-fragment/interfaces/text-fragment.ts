import { GenerateFragmentStatus } from '../enums'

export interface TextFragment {
  textStart: string
  textEnd: string
  prefix: string
  suffix: string
}

export interface GenerateFragmentResult {
  status: GenerateFragmentStatus
  fragment?: TextFragment
}
