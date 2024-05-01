import { Props } from 'shared/ReactTypes'
import { updateElementProps } from './syntheticEvent'

export type Container = Element
export type Instance = Element
export type TextInstance = Text
export const creatHostInstance = (type: string, props: Props) => {
	const el = document.createElement(type)
	updateElementProps(el, props)
	return el
}
export const creatHostTextInstance = (content: string) => document.createTextNode(content)
export const appendHostChild = (child: Element, parent: Element) => {
	parent.appendChild(child)
}
export const appendChildToContainer = appendHostChild
export const updateText = (textInstance: TextInstance, text: string | number) => {
	textInstance.textContent = text.toString()
}
export const removeChild = (child: TextInstance | Element, container: Element) => {
	container.removeChild(child)
}

export const insertChildToContainer = (child: Instance, container: Element, before: Instance) => {
	container.insertBefore(child, before)
}

export const scheduleMicroTask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
			? (cb: (...param: any[]) => void) => Promise.resolve().then(cb)
			: setTimeout
