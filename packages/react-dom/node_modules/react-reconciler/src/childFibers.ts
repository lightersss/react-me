import { Key, Props, ReactElement as ReactElementType } from 'shared/ReactTypes'
import {
	createFiberFromFragement,
	createFiberFromReactElement,
	createWorkInProgress,
	FiberNode
} from './fiber'
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbol'
import { workTags } from './workTags'
import fiberFlags from './fiberFlags'

type existingChildrenMap = Map<string | number, FiberNode>

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) return
		const deletions = returnFiber.deletions
		if (deletions === null) {
			returnFiber.deletions = [childToDelete]
			returnFiber.flags |= fiberFlags.ChildDeletion
		} else {
			returnFiber.deletions?.push(childToDelete)
		}
	}

	function deleteRemainingChildren(returnFiber: FiberNode, currentFirstChild: FiberNode | null) {
		if (!shouldTrackEffects) return
		let childToDelete: null | FiberNode = currentFirstChild
		if (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete)
			childToDelete = childToDelete.sibling
		}
	}

	function reconcileChildArray(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChildren: any[]
	) {
		//把current保存在map中
		const existingChildrenMap: existingChildrenMap = new Map()
		let current = currentFiber
		while (current !== null) {
			const key = current.key !== null ? current.key : current.index
			existingChildrenMap.set(key, current)
			current = current.sibling
		}
		//便利newChildren判断复用

		let lastNewFiber: FiberNode | null = null //最后一个创建的fiber
		let firstNewFiber: FiberNode | null = null //第一个创建的newFiber
		//在遍历新的child的过程中，记录在可以复用fiber时，被复用的fiber在原来的位置
		//如果 出现了某个被复用的fiber 的 index 值小于 lastIndexInOldFibers，就说明这个 被复用的fiber 需要被移动
		//因为如果没有需要移动的节点 那么 lastIndexInOldFibers 会随着遍历 newChild 时index的增加而增加
		let lastIndexInOldFibers = 0

		newChildren.forEach((child, index) => {
			const newFiber = updateFromMap(existingChildrenMap, child, index, returnFiber)
			if (newFiber === null) return
			//标记移动或插入
			newFiber.index = index
			newFiber.return = returnFiber

			if (lastNewFiber === null) {
				lastNewFiber = newFiber
				firstNewFiber = newFiber
			} else {
				lastNewFiber.sibling = newFiber
				lastNewFiber = lastNewFiber.sibling
			}

			if (!shouldTrackEffects) return

			const current = newFiber.alternate
			if (current) {
				const oldIndex = current.index
				if (oldIndex < lastIndexInOldFibers) {
					newFiber.flags |= fiberFlags.Placement
				} else {
					lastIndexInOldFibers = oldIndex
				}
			} else {
				newFiber.flags |= fiberFlags.Placement
			}
		})

		//删除
		existingChildrenMap.forEach((fiber) => deleteChild(returnFiber, fiber))
		return firstNewFiber
	}

	function updateFromMap(
		existingChildrenMap: existingChildrenMap,
		newChild: any,
		newChildIndex: number,
		returnfiber: FiberNode
	) {
		const key = newChild.key !== null ? newChild.key : newChildIndex
		const fiberTryToReUse = existingChildrenMap.get(key)
		if (typeof newChild === 'number' || typeof newChild === 'string') {
			if (fiberTryToReUse && fiberTryToReUse.tag === workTags.HostText) {
				existingChildrenMap.delete(key)
				return useFiber(fiberTryToReUse, { text: newChild })
			}
			return new FiberNode(workTags.HostComponent, { text: newChild }, null)
		}

		if (typeof newChild === 'object' && newChild !== null) {
			if (newChild.$$typeof === REACT_ELEMENT_TYPE) {
				if (newChild.type === REACT_FRAGMENT_TYPE) {
					return updateFragement(returnfiber, fiberTryToReUse, newChild, key, existingChildrenMap)
				}
				if (fiberTryToReUse && fiberTryToReUse.type === newChild.type) {
					existingChildrenMap.delete(key)
					return useFiber(fiberTryToReUse, newChild.props)
				}
			}

			return createFiberFromReactElement(newChild)
		}

		if (Array.isArray(newChild)) {
			return updateFragement(returnfiber, fiberTryToReUse, newChild, key, existingChildrenMap)
		}

		return null
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key
		while (currentFiber !== null) {
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (element.type === currentFiber.type) {
						let props = element.props
						if (element.type === REACT_FRAGMENT_TYPE) {
							props = element.props.children
						}
						const newFiber = useFiber(currentFiber, props)
						newFiber.return = returnFiber
						deleteRemainingChildren(returnFiber, currentFiber.sibling)
						return newFiber
					}
					deleteRemainingChildren(returnFiber, currentFiber.sibling)
					break
				}
			} else {
				deleteChild(returnFiber, currentFiber)
				currentFiber = currentFiber.sibling
			}
		}
		if (element.type === REACT_FRAGMENT_TYPE) {
			return createFiberFromFragement(element.props.children, key)
		} else {
			const fiber = createFiberFromReactElement(element)
			fiber.return = returnFiber
			return fiber
		}
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		text: string | number
	) {
		while (currentFiber !== null) {
			if (currentFiber.tag === workTags.HostText) {
				const newFiber = useFiber(currentFiber, { text })
				newFiber.return = returnFiber
				deleteRemainingChildren(returnFiber, currentFiber.sibling)
				return newFiber
			}
			deleteChild(returnFiber, currentFiber)
			currentFiber = currentFiber.sibling
		}

		const fiber = new FiberNode(workTags.HostText, { text }, null)
		fiber.return = returnFiber
		return fiber
	}

	function placeSingleChild(fiber: FiberNode) {
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= fiberFlags.Placement
		}
		return fiber
	}

	function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		const isUnkeyedTopLevelFragement =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null

		if (isUnkeyedTopLevelFragement) {
			newChild = newChild?.props.children
		}

		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild))
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild))
		}

		if (Array.isArray(newChild)) {
			return reconcileChildArray(returnFiber, currentFiber, newChild)
		}

		if (currentFiber) {
			deleteRemainingChildren(returnFiber, currentFiber)
		}
		return null
	}
	return { reconcileChildFibers }
}

export const reconcileChildFibers = ChildReconciler(true).reconcileChildFibers
export const mountChildFibers = ChildReconciler(false).reconcileChildFibers

const useFiber = (fiber: FiberNode, pendingProps: Props) => {
	const clone = createWorkInProgress(fiber, pendingProps)
	clone.index = 0
	clone.sibling = null
	return clone
}

function updateFragement(
	returnFiber: FiberNode,
	currentFiber: FiberNode | null | undefined,
	elements: any[],
	key: Key,
	existingChildrenMap: existingChildrenMap
) {
	let fiber
	if (!currentFiber || currentFiber.tag !== workTags.Fragment) {
		fiber = createFiberFromFragement(elements, key)
	} else {
		existingChildrenMap.delete(key)
		fiber = useFiber(currentFiber, elements)
	}
	fiber.return = returnFiber
	return fiber
}
