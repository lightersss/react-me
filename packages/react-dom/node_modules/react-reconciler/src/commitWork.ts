import { appendChildToContainer, Container, removeChild, updateText } from 'hostConfig'
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
	if ((flags & fiberFlags.Update) !== fiberFlags.NoFlags) {
		commitUpdate(fiber)
		fiber.flags &= ~fiberFlags.Update
	}
	if ((flags & fiberFlags.ChildDeletion) !== fiberFlags.NoFlags) {
		const deletions = fiber.deletions
		if (deletions !== null) {
			deletions.forEach(commitDeletion)
		}
		// fiber.deletions = null
		fiber.flags &= ~fiberFlags.ChildDeletion
	}
}

const commitPlacement = (fiber: FiberNode) => {
	const hostParent = getHostParent(fiber)
	if (!hostParent) return
	appendPlacementNodeIntoContainer(fiber, hostParent)
}

const commitUpdate = (fiber: FiberNode) => {
	switch (fiber.tag) {
		case workTags.HostText:
			commitTextUpdate(fiber)
			break
	}
}

const commitDeletion = (childToDelete: FiberNode) => {
	let rootHostInstance: FiberNode | null = null as FiberNode | null

	const commitNestedComponent = (root: FiberNode, onUnmount: (fiber: FiberNode) => void) => {
		let node = root
		// eslint-disable-next-line no-constant-condition
		while (true) {
			onUnmount(node)
			if (node.child !== null) {
				node = node.child
				continue
			}
			if (node === root) return
			while (node.sibling === null) {
				if (node.return === null || node.return === root) return
				node = node.return
			}
			node.sibling.return = node.return
			node = node.sibling
		}
	}

	commitNestedComponent(childToDelete, (fiberToUnmount) => {
		switch (fiberToUnmount.tag) {
			case workTags.HostComponent:
				if (rootHostInstance === null) {
					rootHostInstance = fiberToUnmount
				}

				return
			case workTags.HostText:
				if (rootHostInstance === null) {
					rootHostInstance = fiberToUnmount
				}
				return
			case workTags.FunctionComponent:
				if (rootHostInstance === null) {
					// rootHostInstance = fiberToUnmount
				}
				return
		}
	})

	if (rootHostInstance !== null) {
		const hostParent = getHostParent(childToDelete)
		//TODO 有问题
		hostParent && removeChild(rootHostInstance.stateNode, hostParent)
	}
}

const commitTextUpdate = (fiber: FiberNode) => {
	const newText = fiber.memoizedProps.text
	updateText(fiber.stateNode, newText)
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
