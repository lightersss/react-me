import { ReactElement as ReactElementType } from 'shared/ReactTypes'
import { createFiberFromReactElement, FiberNode } from './fiber'
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol'
import { workTags } from './workTags'
import fiberFlags from './fiberFlags'

function ChildReconciler(shouldTrackEffects: boolean) {
	function reconcileSingleElement(
		returnFiber: FiberNode,
		// currentFiber: FiberNode | null | undefined,
		element: ReactElementType
	) {
		const fiber = createFiberFromReactElement(element)
		fiber.return = returnFiber
		return fiber
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		// currentFiber: FiberNode | null | undefined,
		text: string | number
	) {
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
		currentFiber: FiberNode | null | undefined,
		newChild?: ReactElementType
	) {
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(reconcileSingleElement(returnFiber, newChild))
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(reconcileSingleTextNode(returnFiber, newChild))
		}

		return null
	}
	return { reconcileChildFibers }
}

export const reconcileChildFibers = ChildReconciler(true).reconcileChildFibers
export const mountChildFibers = ChildReconciler(false).reconcileChildFibers
