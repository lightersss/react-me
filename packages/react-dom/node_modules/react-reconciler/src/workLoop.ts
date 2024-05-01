import { scheduleMicroTask } from 'hostConfig'
import { beginWork } from './beginWork'
import { commitMutationEffects } from './commitWork'
import { compeleteWork } from './completeWork'
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber'
import fiberFlags, { fiberMask } from './fiberFlags'
import {
	getHighestPriorityLane,
	Lane,
	markRootFinished,
	mergeLans,
	NoLane,
	SyncLane
} from './fiberLane'
import { flushSyncCallback, scheduleSyncCallback } from './syncTaskQueue'
import { workTags } from './workTags'

let workInProgress: FiberNode | null = null
let workInProgressRootRenderLane: Lane = NoLane

const prepareFreshContext = (fiberRootNode: FiberRootNode, lane: Lane) => {
	workInProgress = createWorkInProgress(fiberRootNode.current, {})
	workInProgressRootRenderLane = lane
}

export const scheduleUpdateOnFiber = (fiber: FiberNode, lane: Lane) => {
	const root = markUpdateFromFiberToRoot(fiber)
	markRootUpdated(root, lane)
	ensureRootIsScheduled(root)
}

function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHighestPriorityLane(root.pendingLans)
	if (updateLane === NoLane) {
		return
	}
	if (updateLane === SyncLane) {
		scheduleSyncCallback(performSyncWorkOnFiber.bind(null, root, updateLane))
		scheduleMicroTask(flushSyncCallback)
	} else {
		//
	}
}

const markRootUpdated = (root: FiberRootNode, lane: Lane) => {
	root.pendingLans = mergeLans(root.pendingLans, lane)
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
	console.debug('commitRoot start')
	const finishedWork = root.finishedWork
	if (!finishedWork) return
	const finishedLane = root.finishedLane
	root.finishedWork = null
	root.finishedLane = NoLane
	markRootFinished(root, finishedLane)

	const subtreeHasEffect = (finishedWork.subTreeFlags & fiberMask.Mutation) !== fiberFlags.NoFlags
	const rootHasEffect = (finishedWork.flags & fiberMask.Mutation) !== fiberFlags.NoFlags

	if (subtreeHasEffect || rootHasEffect) {
		root.current = finishedWork
		commitMutationEffects(finishedWork)
	} else {
		root.current = finishedWork
	}
}

const performSyncWorkOnFiber = (fiberRootNode: FiberRootNode, lane: Lane) => {
	console.debug('performSyncWorkOnFiber begin')
	const nextLane = getHighestPriorityLane(fiberRootNode.pendingLans)
	if (nextLane !== SyncLane) {
		ensureRootIsScheduled(fiberRootNode)
		return
	}
	prepareFreshContext(fiberRootNode, lane)
	do {
		workLoop()
		break
		// eslint-disable-next-line no-constant-condition
	} while (true)

	fiberRootNode.finishedWork = fiberRootNode.current.alternate

	workInProgressRootRenderLane = NoLane
	fiberRootNode.finishedLane = lane
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
	const nextFiber = beginWork(fiber, workInProgressRootRenderLane)
	fiber.memoizedProps = fiber.pendingProps
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
