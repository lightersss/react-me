import { Dispatch } from 'react/src/currentDispacher'
import { SetStateAction } from 'shared/ReactTypes'

/**
 * @description
 * 在触发更新时描述这个 更新 的数据结构
 */
export interface Update<State> {
	action: SetStateAction<State>
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
export function createUpdate<State>(action: SetStateAction<State>): Update<State> {
	return {
		action
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
	updateQueue.shared.pending = update
}

export function processUpdateQueue<State>(baseState: State, pendingUpdate: Update<State> | null) {
	if (pendingUpdate == null) return { memorizedState: baseState }

	let result: State = baseState
	const action = pendingUpdate.action
	if (action instanceof Function) {
		result = action(baseState)
	} else {
		result = action
	}
	return {
		memorizedState: result
	}
}
