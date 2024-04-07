import { appendHostChild, creatHostInstance, creatHostTextInstance, Instance } from 'hostConfig'
import { FiberNode } from './fiber'
import { workTags } from './workTags'
import fiberFlags from './fiberFlags'

export const compeleteWork = (wipFiber: FiberNode) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const newProps = wipFiber.pendingProps
	const current = wipFiber.alternate

	switch (wipFiber.tag) {
		case workTags.HostComponent:
			if (current !== null && wipFiber.stateNode) {
				//
			} else {
				// const instance = creatHostInstance(wipFiber.type, newProps)
				const instance = creatHostInstance(wipFiber.type)
				appendAllChildren(instance, wipFiber)
				wipFiber.stateNode = instance
				bubbleFlags(wipFiber)
			}
			break
		case workTags.HostText:
			if (current !== null && wipFiber.stateNode) {
				//
			} else {
				const instance = creatHostTextInstance(wipFiber.pendingProps.text)
				// const instance = creatHostTextInstance(wipFiber.type, newProps)
				wipFiber.stateNode = instance
				bubbleFlags(wipFiber)
			}
			break
		case workTags.FunctionComponent:
			bubbleFlags(wipFiber)
			break
		case workTags.HostRoot:
			bubbleFlags(wipFiber)
			break
		default:
			break
	}
	return wipFiber
}

function appendAllChildren(parentInstance: Instance, wipFiber: FiberNode) {
	let node = wipFiber.child
	while (node !== null) {
		if (node?.tag === workTags.HostComponent || node?.tag === workTags.HostText) {
			appendHostChild(node.stateNode, parentInstance)
		} else if (node.child !== null) {
			node.child.return = node
			node = node.child
			continue
		}

		if (node === wipFiber) return

		while (node?.sibling === null) {
			if (node?.return === null || node?.return === wipFiber) {
				return
			}
			//向上找到第一个有兄弟节点的fiber
			node = node.return
		}
		node.sibling.return = node.return
		//开始对兄弟节点进行append
		node = node.sibling
	}
}

function bubbleFlags(wipFiber: FiberNode) {
	let subTreeFlags = fiberFlags.NoFlags
	let child = wipFiber.child

	while (child !== null) {
		subTreeFlags = subTreeFlags | child.subTreeFlags | child.flags

		child.return = wipFiber
		child = child.sibling
	}
	wipFiber.subTreeFlags |= subTreeFlags
}
