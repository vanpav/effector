import {DOMElement} from './index.h'

export type ChildBlock =
  | FF
  | ElementBlock
  | ListBlock
  | TextBlock
  | RouteBlock
  | RecItemBlock
  | RecBlock
  | BlockBlock
  | BlockItemBlock

export type Block =
  | FragmentBlock
  | ListBlock
  | UsingBlock
  | TextBlock
  | ElementBlock
  | RouteBlock
  | RecItemBlock
  | RecBlock
  | BlockBlock
  | BlockItemBlock

export type RouteBlock = {
  type: 'route'
  parent: FragmentBlock
  child: RF
  visible: boolean
  index: number
}

export type FragmentBlock = {
  type: 'fragment'
  parent:
    | FF
    | UsingBlock
    | ElementBlock
    | LF
    | RF
    | RecItemBlock
    | RecBlock
    | BlockBlock
    | BlockItemBlock
  child: ChildBlock[]
}

export type ElementBlock = {
  type: 'element'
  parent: FragmentBlock
  child: FragmentBlock
  value: DOMElement
  visible: boolean
  index: number
}

export type ListBlock = {
  type: 'list'
  parent: FragmentBlock
  child: LF[]
  lastChild: LF | null
  visible: boolean
  index: number
}

export type TextBlock = {
  type: 'text'
  parent: FragmentBlock
  value: Text
  visible: boolean
  index: number
}

export type UsingBlock = {
  type: 'using'
  child: FragmentBlock
  value: DOMElement
}

export type RF = {
  type: 'RF'
  parent: RouteBlock
  child: FragmentBlock
  visible: boolean
  // index: number
}

export type FF = {
  type: 'FF'
  parent: FragmentBlock
  child: FragmentBlock
  visible: boolean
  index: number
}

export type LF = {
  type: 'LF'
  parent: ListBlock
  child: FragmentBlock
  visible: boolean
  childInitialized: boolean
  left: LF | null
  right: LF | null
}

export type RecItemBlock = {
  type: 'recItem'
  parent: FragmentBlock
  child: FragmentBlock
  visible: boolean
  index: number
}

export type RecBlock = {
  type: 'rec'
  parent: FragmentBlock
  child: FragmentBlock
  visible: boolean
  index: number
}

export type BlockBlock = {
  type: 'block'
  parent: FragmentBlock
  child: FragmentBlock
  visible: boolean
  index: 0
}

export type BlockItemBlock = {
  type: 'blockItem'
  parent: FragmentBlock
  child: FragmentBlock
  visible: boolean
  index: number
}
