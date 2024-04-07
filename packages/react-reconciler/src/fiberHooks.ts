import { Dispatch, Dispatcher } from 'react/src/currentDispacher'
import { FiberNode } from './fiber'
import internals from 'shared/internals'
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { SetStateAction } from 'shared/ReactTypes'
const { currentDispatcher } = internals
type Hook = {
	/**
	 * hook自己的状态
	 */
	momoizedState: any
	udpateQueue: unknown
	next: Hook | null
}
let currentRenderingFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null

export function renderWithHooks(fiber: FiberNode) {
	currentRenderingFiber = fiber
	fiber.memoizedState = null

	const current = fiber.alternate

	if (current !== null) {
		//
	} else {
		currentDispatcher.current = HooksDispatcherOnMount
	}

	const Comp = fiber.type
	const props = fiber.pendingProps
	const children = Comp(props)
	currentRenderingFiber = null
	return children
}
const mountWorkInProgressHook = () => {
	const hook: Hook = {
		momoizedState: null,
		udpateQueue: null,
		next: null
	}

	if (workInProgressHook === null) {
		if (currentRenderingFiber === null) {
			throw new Error('call hook in fc')
		} else {
			workInProgressHook = hook
			currentRenderingFiber.memoizedState = workInProgressHook
		}
	} else {
		workInProgressHook.next = hook
		workInProgressHook = workInProgressHook.next
	}
	return hook
}

const dispatchSetState = <State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: SetStateAction<State>
) => {
	const update = createUpdate(action)
	enqueueUpdate(updateQueue, update)
	scheduleUpdateOnFiber(fiber)
}

const mountState = <State>(initalState: State | (() => State)): [State, Dispatch<State>] => {
	const hook = mountWorkInProgressHook()
	let state: State
	if (initalState instanceof Function) {
		state = initalState()
	} else {
		state = initalState
	}

	const updateQueue = createUpdateQueue<State>() as UpdateQueue<State>
	hook.udpateQueue = updateQueue

	const dispatch = dispatchSetState.bind<
		null,
		[FiberNode, UpdateQueue<State>],
		[SetStateAction<State>],
		void
	>(null, currentRenderingFiber!, updateQueue)

	updateQueue.dispatch = dispatch
	return [state, dispatch]
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
}
