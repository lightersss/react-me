export type Container = Element
export type Instance = Element
export type TextInstance = Text
export const creatHostInstance = (type: string) => document.createElement(type)
export const creatHostTextInstance = (content: string) => document.createTextNode(content)
export const appendHostChild = (child: Element, parent: Element) => parent.appendChild(child)
export const appendChildToContainer = appendHostChild
export const updateText = (textInstance: TextInstance, text: string | number) => {
	textInstance.textContent = text.toString()
}
export const removeChild = (child: TextInstance | Element, container: Element) => {
	container.removeChild(child)
}
