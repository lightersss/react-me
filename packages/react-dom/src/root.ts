import { createContainer, updateContainer } from 'react-reconciler/src/fiberReconciler'
import { Container } from './hostConfig'
import { ReactElement } from 'shared/ReactTypes'
import { initEvent } from './syntheticEvent'

export function createRoot(container: Container) {
	const root = createContainer(container)
	return {
		render: (reactElement: ReactElement) => {
			console.log('render')
			initEvent(container, 'click')
			return updateContainer(reactElement, root)
		}
	}
}
