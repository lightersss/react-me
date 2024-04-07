import { appendChildToContainer, Container } from 'hostConfig'
import { FiberNode } from './fiber'
import fiberFlags, { fiberMask } from './fiberFlags'
import { workTags } from './workTags'

let nextFiber: FiberNode | null = null

export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextFiber = finishedWork
	while (nextFiber !== null) {
		if (
			(nextFiber.subTreeFlags & fiberMask.Mutation) !== fiberFlags.NoFlags &&
			nextFiber.child !== null
		) {
			nextFiber = nextFiber.child
		} else {
			while (nextFiber !== null) {
				commitMutationEffectOnFiber(nextFiber)
				let sibling = nextFiber.sibling

				if (sibling !== null) {
					sibling = sibling.sibling
					break
				}
				nextFiber = nextFiber.return
			}
		}
	}
}

const commitMutationEffectOnFiber = (fiber: FiberNode) => {
	const flags = fiber.flags

	if ((flags & fiberFlags.Placement) !== fiberFlags.NoFlags) {
		commitPlacement(fiber)
		fiber.flags &= ~fiberFlags.Placement
	}
}

const commitPlacement = (fiber: FiberNode) => {
	const hostParent = getHostParent(fiber)
	if (!hostParent) return
	appendPlacementNodeIntoContainer(fiber, hostParent)
}
const getHostParent = (fiber: FiberNode): Container | null => {
	let parent = fiber.return
	while (parent) {
		if (parent.tag === workTags.HostComponent) {
			return parent.stateNode
		}
		if (parent.tag === workTags.HostRoot) {
			return parent.stateNode.container
		}

		parent = parent.return
	}
	return null
}

const appendPlacementNodeIntoContainer = (placementFiber: FiberNode, hostParent: Container) => {
	if (placementFiber.tag === workTags.HostComponent || placementFiber.tag === workTags.HostText) {
		appendChildToContainer(placementFiber.stateNode, hostParent)
		return
	}

	const child = placementFiber.child
	if (child !== null) {
		appendPlacementNodeIntoContainer(child, hostParent)

		let sibling = child.sibling
		while (sibling) {
			appendChildToContainer(sibling.stateNode, hostParent)
			sibling = sibling.sibling
		}
	}
}
