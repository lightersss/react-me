import currentDispatcher, { Dispatcher, resolveDispatcher } from './src/currentDispacher'
import { jsx } from './src/jsx'

export const useState: Dispatcher['useState'] = (initalValue) => {
	const dispatcher = resolveDispatcher()
	return dispatcher.useState(initalValue)
}

export const __birdge__ = {
	currentDispatcher
}
export const createElement = jsx

export default {
	version: '1.0.0',
	createElement: jsx
}
