import { Dispatch } from 'react/src/currentDispacher'
import { SetStateAction } from 'shared/ReactTypes'
import { Lane } from './fiberLane'

/**
 * @description
 * 在触发更新时描述这个 更新 的数据结构
 */
export interface Update<State> {
	action: SetStateAction<State>
	lane: Lane
	next: Update<any> | null
}

/**
 * @description
 * 更新队列
 */
export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null
	}
	dispatch: Dispatch<State> | null
}

/**
 * @description 创建update对象
 * @param {SetStateAction} action
 * @returns {Update} update
 */
export function createUpdate<State>(action: SetStateAction<State>, lane: Lane): Update<State> {
	return {
		action,
		lane,
		next: null
	}
}

export function createUpdateQueue<T>() {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as {
		shared: {
			pending: Update<T> | null
		}
		dispatch: Dispatch<T> | null
	}
}

export function enqueueUpdate<State>(updateQueue: UpdateQueue<State>, update: Update<State>) {
	const pending = updateQueue.shared.pending
	if (pending === null) {
		//pending -> a -> a
		update.next = update
	} else {
		//b.next = a
		update.next = pending.next
		//a.next = b
		pending.next = update

		//pending = b -> a -> b
		//pending = c -> a -> b -> c
		//penging始终指向最新的更新
		//pending.next指向最开始的更新
	}
	updateQueue.shared.pending = update
}

export function processUpdateQueue<State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	lane: Lane
) {
	if (pendingUpdate === null) return { memorizedState: baseState }
	let result: State = baseState
	const firstUpdate = pendingUpdate.next
	let pending: Update<any> | null | undefined = firstUpdate
	do {
		const updateLane = pending?.lane
		if (updateLane === lane) {
			const action = pending?.action
			if (action instanceof Function) {
				result = action(result)
			} else {
				result = action
			}
		} else {
			console.error('wrong else')
		}
		pending = pending?.next
	} while (pending !== firstUpdate)

	return {
		memorizedState: result
	}
}
