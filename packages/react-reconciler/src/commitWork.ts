import {
	appendChildToContainer,
	Container,
	insertChildToContainer,
	Instance,
	removeChild,
	updateText
} from 'hostConfig'
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
				const sibling: FiberNode | null = nextFiber.sibling

				if (sibling !== null) {
					nextFiber = sibling
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
	const hostSibling = getHostSibling(fiber)
	if (!hostParent) return
	insterOrAppendPlacementNodeIntoContainer(fiber, hostParent, hostSibling)
}

//找到最近的 hostcomponent 的 兄弟节点
const getHostSibling = (fiber: FiberNode) => {
	let node = fiber

	// eslint-disable-next-line no-constant-condition
	outer: while (true) {
		while (node.sibling === null) {
			const parent = fiber.return

			if (
				parent === null ||
				//找到父亲的 hostcomponent 了，说明sibling里没有可以用的 hostcomponent 了
				parent.tag === workTags.HostComponent ||
				parent.tag === workTags.HostRoot
			) {
				return null
			}

			node = parent
		}

		node.sibling.return = node.return
		node = node.sibling

		while (node.tag !== workTags.HostComponent && node.tag !== workTags.HostText) {
			if ((node.flags & fiberFlags.Placement) !== fiberFlags.NoFlags) {
				continue outer
			}

			if (node.child === null) {
				continue outer
			} else {
				node.child.return = node
				node = node.child
			}
		}

		if ((node.flags & fiberFlags.Placement) === fiberFlags.NoFlags) {
			return node.stateNode
		}
	}
}

const commitUpdate = (fiber: FiberNode) => {
	switch (fiber.tag) {
		case workTags.HostText:
			commitTextUpdate(fiber)
			break
	}
}

function recordChildToDelete(childrenToDelete: FiberNode[], fiber: FiberNode) {
	const lastOne = childrenToDelete[childrenToDelete.length - 1]
	if (!lastOne) {
		childrenToDelete.push(fiber)
	} else {
		let node = lastOne.sibling
		while (node !== null) {
			if (fiber === node) {
				childrenToDelete.push(fiber)
			}
			node = node.sibling
		}
	}
}

const commitDeletion = (childToDelete: FiberNode) => {
	// let rootHostInstance: FiberNode | null = null as FiberNode | null
	const childrenToDelete: FiberNode[] = []

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
				// if (rootHostInstance === null) {
				// 	rootHostInstance = fiberToUnmount
				// }
				recordChildToDelete(childrenToDelete, fiberToUnmount)

				return
			case workTags.HostText:
				recordChildToDelete(childrenToDelete, fiberToUnmount)

				return
			case workTags.FunctionComponent:
				// if (rootHostInstance === null) {
				// 	// rootHostInstance = fiberToUnmount
				// }
				return
		}
	})

	if (childrenToDelete.length) {
		const hostParent = getHostParent(childToDelete)
		hostParent && childrenToDelete.forEach((child) => removeChild(child.stateNode, hostParent))
		// hostParent && removeChild(rootHostInstance.stateNode, hostParent)
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

const insterOrAppendPlacementNodeIntoContainer = (
	placementFiber: FiberNode,
	hostParent: Container,
	before?: Instance
) => {
	if (placementFiber.tag === workTags.HostComponent || placementFiber.tag === workTags.HostText) {
		if (before) {
			insertChildToContainer(placementFiber.stateNode, hostParent, before)
		} else {
			appendChildToContainer(placementFiber.stateNode, hostParent)
		}
		return
	}

	const child = placementFiber.child
	if (child !== null) {
		insterOrAppendPlacementNodeIntoContainer(child, hostParent)

		let sibling = child.sibling
		while (sibling) {
			insterOrAppendPlacementNodeIntoContainer(sibling, hostParent)
			sibling = sibling.sibling
		}
	}
}
