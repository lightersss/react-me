import { Container } from 'hostConfig'
import { Props } from 'shared/ReactTypes'

export const ELEMENT_PROPS_KEY = '__props__'
export interface SyntheticDomElement extends Element {
	[ELEMENT_PROPS_KEY]: Props
}

export function updateElementProps(element: Element, props: Props) {
	element[ELEMENT_PROPS_KEY] = props
}

interface SyntheticEvent extends Event {
	__stopPropagation__: boolean
}

const eventTypeList = ['click']

function createSyntheticEvent(e: Event) {
	const syntheticEvent: Event = e
	;(syntheticEvent as SyntheticEvent).__stopPropagation__ = false

	const originStopPropagation = e.stopPropagation
	syntheticEvent.stopPropagation = () => {
		;(syntheticEvent as SyntheticEvent).__stopPropagation__ = true
		originStopPropagation?.()
	}

	return syntheticEvent as SyntheticEvent
}

export function initEvent(container: Container, eventType: string) {
	if (!eventTypeList.includes(eventType)) return
	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e)
	})
}

const eventTypeToEventCallbackNameMap = {
	click: ['onClickCapture', 'onClick']
}

function collectEvent(element: SyntheticDomElement, container: Container, eventType: string) {
	const res: {
		capture: ((e: Event) => void)[]
		bubble: ((e: Event) => void)[]
	} = {
		capture: [],
		bubble: []
	}

	let el: SyntheticDomElement | null = element
	while (el && el !== container) {
		const callBackNameList = eventTypeToEventCallbackNameMap[eventType]
		if (callBackNameList) {
			const captureCb = el[ELEMENT_PROPS_KEY][callBackNameList[0]]
			captureCb && res.capture.unshift(captureCb)
			const bubbleCb = el[ELEMENT_PROPS_KEY][callBackNameList[1]]
			bubbleCb && res.bubble.push(bubbleCb)
		}
		el = el.parentElement as any
	}

	return res
}

function triggerEvents(captureEvents: ((e: Event) => void)[], syntheticEvent: SyntheticEvent) {
	for (const cb of captureEvents) {
		cb(syntheticEvent)
		if (syntheticEvent.__stopPropagation__) break
	}
}

function dispatchEvent(container: Container, eventType: string, event: Event) {
	const target = event.target
	if (!target) return
	//收集事件
	const { capture, bubble } = collectEvent(target as SyntheticDomElement, container, eventType)
	const syntheticEvent = createSyntheticEvent(event)
	triggerEvents(capture, syntheticEvent)

	if (syntheticEvent.__stopPropagation__) return
	triggerEvents(bubble, syntheticEvent)
}
