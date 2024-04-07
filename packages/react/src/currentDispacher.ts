import { SetStateAction } from 'shared/ReactTypes'

export type Dispatch<state> = (action: SetStateAction<state>) => void

/**
 * hooks的集合
 */
export type Dispatcher = {
	useState: <T>(initialState: T | (() => T)) => [T, Dispatch<T>]
}

/**
 * @description
 * 当前hooks的集合
 * 在不同的阶段 比如 mount/update currentDispatcher.current会指向不同的 hooks集合
 * 通过修改 currentDispatcher.current 来达到不同阶段不同的处理
 */
const currentDispatcher: { current: Dispatcher | null } = {
	current: null
}

export const resolveDispatcher = () => {
	const dispatcher = currentDispatcher.current
	if (dispatcher === null) {
		throw new Error('function component only')
	}

	return dispatcher
}

export default currentDispatcher
