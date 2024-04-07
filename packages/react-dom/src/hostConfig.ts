export type Container = Element
export type Instance = Element

export const creatHostInstance = (type: string) => document.createElement(type)
export const creatHostTextInstance = (content: string) => document.createTextNode(content)
export const appendHostChild = (child: Element, parent: Element) => parent.appendChild(child)
export const appendChildToContainer = appendHostChild
