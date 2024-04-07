import { beginWork } from './beginWork'
import { commitMutationEffects } from './commitWork'
import { compeleteWork } from './completeWork'
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber'
import fiberFlags, { fiberMask } from './fiberFlags'
import { workTags } from './workTags'

let workInProgress: FiberNode | null = null

const prepareFreshContext = (fiberRootNode: FiberRootNode) => {
	workInProgress = createWorkInProgress(fiberRootNode.current, {})
}

export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
	const root = markUpdateFromFiberToRoot(fiber)
	renderRoot(root)
}

const markUpdateFromFiberToRoot = (fiber: FiberNode) => {
	let currentNode = fiber
	while (currentNode.return !== null) {
		currentNode = currentNode.return
	}
	if (currentNode.tag === workTags.HostRoot) {
		return currentNode.stateNode
	}
	return null
}

const commitRoot = (root: FiberRootNode) => {
	const finishedWork = root.finishedWork
	if (!finishedWork) return
	root.finishedWork = null

	const subtreeHasEffect = (finishedWork.subTreeFlags & fiberMask.Mutation) !== fiberFlags.NoFlags
	const rootHasEffect = (finishedWork.flags & fiberMask.Mutation) !== fiberFlags.NoFlags

	if (subtreeHasEffect || rootHasEffect) {
		root.current = finishedWork
		commitMutationEffects(finishedWork)
	} else {
		root.current = finishedWork
	}
}

const renderRoot = (fiberRootNode: FiberRootNode) => {
	prepareFreshContext(fiberRootNode)
	do {
		workLoop()
		break
		// eslint-disable-next-line no-constant-condition
	} while (true)

	fiberRootNode.finishedWork = fiberRootNode.current.alternate
	if (fiberRootNode.finishedWork) {
		commitRoot(fiberRootNode)
	}
}
const workLoop = () => {
	while (workInProgress) {
		performUnitOfWork(workInProgress)
	}
}
/**
 *
 * @param fiber
 * @description 在workLoop中 performUnitOfWork 一路递归向下到最底层的子节点(CFilber)，（期间路径上的所有的节点都会执行beginWork）， 然后执行CFilber的completeUnitOfWork
 */
const performUnitOfWork = (fiber: FiberNode) => {
	const nextFiber = beginWork(fiber)
	fiber.memoizedPros = fiber.pendingProps
	if (nextFiber === null) {
		completeUnitOfWork(fiber)
	} else {
		workInProgress = nextFiber
	}
}
/**
 *
 * @param fiber
 * @returns 在performUnitOfWork中，一旦递归到了最后的子节点fiber，那么说明这个fiber没有子节点，对这个子节点执行completeUnitOfWork
 * 如果这个子节点有兄弟节点 ：那么结束这个fiber的 completeUnitOfWork ，把兄弟节点作为workInProgress，进入下一个workLoop中的while循环，对兄弟节点进行 performUnitOfWork
 * 如果这个子节点没有兄弟节点 ：那么会在do while中直接一路向上对父节点执行compeleteWork，直到某个父节点有兄弟节点（PFiber），跳出completeUnitOfWork，对这个 PFiber 进行 performUnitOfWork
 *
 */
const completeUnitOfWork = (fiber: FiberNode) => {
	let node: FiberNode | null = fiber
	do {
		compeleteWork(node)
		const silbing = node.sibling
		if (silbing) {
			workInProgress = silbing
			return
		}
		node = node.return
		workInProgress = node
	} while (node)
}
