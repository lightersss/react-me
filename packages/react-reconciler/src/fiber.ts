import { Key, Props, ReactElement as ReactElementType, Ref } from 'shared/ReactTypes'
import { workTags } from './workTags'
import fiberFlags from './fiberFlags'
import { Container } from 'hostConfig'
import { UpdateQueue } from './updateQueue'

export class FiberNode {
	type: any
	tag: workTags
	pendingProps: Props
	key: Key
	stateNode: any
	return: null | FiberNode
	sibling: null | FiberNode
	child: null | FiberNode
	index: number
	ref: Ref
	memoizedProps: Props
	memoizedState: any

	updateQueue: UpdateQueue<unknown>
	deletions: FiberNode[] | null

	alternate: null | FiberNode = null
	flags: fiberFlags = fiberFlags.NoFlags
	subTreeFlags: fiberFlags = fiberFlags.NoFlags
	constructor(tag: workTags, pendingProps: Props, key: Key) {
		this.tag = tag
		this.key = key
		/**
		 * 对于HostCompent stateNode对应宿主环境中的节点。比如div
		 */
		this.stateNode = null
		/**
		 * 对于FunctionCompent type对应函数组件的函数
		 */
		this.type = null

		this.return = null
		this.sibling = null
		this.child = null
		/**
		 *这个FiberNode作为child时，对应的下标
		 */
		this.index = 0
		this.ref = null

		/**
		 * 当前正在处理的Fiber的props
		 */
		this.pendingProps = pendingProps
		/**
		 * pedningprops处理完成后变成memoizedPros
		 */
		this.memoizedProps = null
		this.updateQueue = {
			shared: { pending: null },
			dispatch: null
		}
		this.deletions = null
		this.alternate = null
		this.flags = fiberFlags.NoFlags
		this.subTreeFlags = fiberFlags.NoFlags
	}
}

/**
 * @description 应用的根节点
 * createRoot(A).render(B)中的 A对应了 container
 * FiberRootNode.stateNode === A
 * A.current  === FiberRootNode
 */
export class FiberRootNode {
	container: Container
	current: FiberNode
	finishedWork: FiberNode | null
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container
		this.current = hostRootFiber
		hostRootFiber.stateNode = this
		this.finishedWork = null
	}
}

/**
 * @description
 * 给定一个fiber，创建对应的alternate fiber
 */
export const createWorkInProgress = (fiber: FiberNode, pendingProps: Props) => {
	let wip = fiber.alternate
	if (wip === null) {
		wip = new FiberNode(fiber.tag, pendingProps, fiber.key)
		wip.stateNode = fiber.stateNode
		wip.alternate = fiber
		fiber.alternate = wip
	} else {
		wip.pendingProps = pendingProps
		wip.flags = fiberFlags.NoFlags
		fiber.deletions = null
	}
	wip.type = fiber.type
	wip.updateQueue = fiber.updateQueue
	wip.child = fiber.child
	wip.memoizedProps = fiber.memoizedProps
	wip.memoizedState = fiber.memoizedState
	return wip
}

export function createFiberFromReactElement(reactElement: ReactElementType) {
	const { type, key, props } = reactElement
	let fiberTag: workTags = workTags.FunctionComponent
	if (typeof type === 'string') {
		fiberTag = workTags.HostComponent
	} else if (typeof type !== 'function' && __DEV__) {
		console.error('未定义的 createFiberFromReactElement')
	}

	const fiber = new FiberNode(fiberTag, props, key)
	fiber.type = type
	return fiber
}
