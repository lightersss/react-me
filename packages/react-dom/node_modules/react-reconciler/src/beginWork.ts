import { ReactElement as ReactElementType } from 'shared/ReactTypes'
import { FiberNode } from './fiber'
import { processUpdateQueue } from './updateQueue'
import { workTags } from './workTags'
import { mountChildFibers, reconcileChildFibers } from './childFibers'
import { renderWithHooks } from './fiberHooks'

export const beginWork = (fiber: FiberNode) => {
	switch (fiber.tag) {
		case workTags.HostRoot:
			return updateHostRoot(fiber)
		case workTags.FunctionComponent:
			return updateFunctionComponent(fiber)
		case workTags.HostComponent:
			return updateHostComponent(fiber)
		case workTags.HostText:
			return null
		default:
			if (__DEV__) {
				console.error('未实现的类型')
			}
	}
	return fiber
}

/**
 *
 * @description
 * 对于HostRoot类型的fiber，enqueueUpdate在 updateContainer 中完成
 * updateContainer中会把 <App/>作为update挂载 updateQueue.pending.shared 下
 * 所以在这里拿到的memorizedState 就是 App 这个fiber
 * @param fiber
 * @returns
 */
function updateHostRoot(fiber: FiberNode) {
	const baseState = fiber.memoizedState
	const updateQueue = fiber.updateQueue
	const pendingUpdateQueue = updateQueue?.shared.pending
	updateQueue.shared.pending = null
	const { memorizedState } = processUpdateQueue(baseState, pendingUpdateQueue)
	fiber.memoizedState = memorizedState
	reconcileChildren(fiber, memorizedState as ReactElementType)
	return fiber.child
}

function updateHostComponent(fiber: FiberNode) {
	const children = fiber.pendingProps.children
	reconcileChildren(fiber, children)
	return fiber.child
}

function reconcileChildren(wipFiber: FiberNode, children?: ReactElementType) {
	const current = wipFiber.alternate //当前渲染在屏幕上的fiber结构

	if (!current) {
		wipFiber.child = mountChildFibers(wipFiber, null, children)
	} else {
		wipFiber.child = reconcileChildFibers(wipFiber, current?.child, children)
	}
}

function updateFunctionComponent(fiber: FiberNode) {
	const children = renderWithHooks(fiber)
	reconcileChildren(fiber, children)
	return fiber.child
}
