import { Dispatch, Dispatcher } from 'react/src/currentDispacher'
import { FiberNode } from './fiber'
import internals from 'shared/internals'
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { SetStateAction } from 'shared/ReactTypes'
const { currentDispatcher } = internals
type Hook = {
	/**
	 * hook自己的状态
	 */
	momoizedState: any
	udpateQueue: UpdateQueue<unknown>
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
		currentDispatcher.current = HooksDispatcherOnUpdate
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
		udpateQueue: { shared: { pending: null }, dispatch: null },
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
	hook.udpateQueue = updateQueue as UpdateQueue<unknown>

	const dispatch = dispatchSetState.bind<
		null,
		[FiberNode, UpdateQueue<State>],
		[SetStateAction<State>],
		void
	>(null, currentRenderingFiber!, updateQueue)

	updateQueue.dispatch = dispatch
	return [state, dispatch]
}

let currentHook: Hook | null = null
const updateWorkInProgressHook = () => {
	const currentFiber = currentRenderingFiber?.alternate
	let hookToUpdate: Hook | null = null
	if (currentHook === null) {
		if (currentFiber !== null) {
			hookToUpdate = currentFiber?.memoizedState
		} else {
			hookToUpdate = null
		}
	} else {
		hookToUpdate = currentHook.next
	}

	if (hookToUpdate === null) {
		//进入到这个逻辑说明
		//上面 hookToUpdate = currentHook.next 执行完 hookToUpdate = null
		//说明 上一次fiber执行结果的hook链表到currentHook已经结束了，但是这次还没结束，还在试图匹配上一次的
		throw new Error('hook数量不匹配')
	}

	currentHook = hookToUpdate

	const newHook: Hook = {
		momoizedState: currentHook?.momoizedState,
		udpateQueue: hookToUpdate?.udpateQueue,
		next: null
	}

	if (workInProgressHook === null) {
		if (currentRenderingFiber === null) {
			throw new Error('call hook in fc')
		} else {
			workInProgressHook = newHook
			currentRenderingFiber.memoizedState = workInProgressHook
		}
	} else {
		workInProgressHook.next = newHook
		workInProgressHook = workInProgressHook.next
	}

	return newHook
}
const updateState = <State>(): [State, Dispatch<State>] => {
	const hook = updateWorkInProgressHook()
	const queue = hook.udpateQueue
	const pending = queue.shared.pending

	if (pending !== null) {
		const { memorizedState } = processUpdateQueue(hook.momoizedState, pending)
		hook.momoizedState = memorizedState
	}

	return [hook.momoizedState, queue.dispatch as Dispatch<State>]
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
}

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
}
