import { Props, ReactElement as ReactElementType } from 'shared/ReactTypes'
import { createFiberFromReactElement, createWorkInProgress, FiberNode } from './fiber'
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol'
import { workTags } from './workTags'
import fiberFlags from './fiberFlags'

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

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key
		if (currentFiber !== null) {
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (element.type === currentFiber.type) {
						const newFiber = useFiber(currentFiber, element.props)
						newFiber.return = returnFiber
						return newFiber
					}
					deleteChild(returnFiber, currentFiber)
				}
			} else {
				deleteChild(returnFiber, currentFiber)
			}
		}
		const fiber = createFiberFromReactElement(element)
		fiber.return = returnFiber
		return fiber
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		text: string | number
	) {
		if (currentFiber !== null) {
			if (currentFiber.tag === workTags.HostText) {
				const newFiber = useFiber(currentFiber, { text })
				newFiber.return = returnFiber
				return newFiber
			}
			deleteChild(returnFiber, currentFiber)
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
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild))
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild))
		}

		if (currentFiber) {
			deleteChild(returnFiber, currentFiber)
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
