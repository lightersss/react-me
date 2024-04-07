import { createContainer, updateContainer } from 'react-reconciler/src/fiberReconciler'
import { Container } from './hostConfig'
import { ReactElement } from 'shared/ReactTypes'

export function createRoot(container: Container) {
	const root = createContainer(container)
	return {
		render: (reactElement: ReactElement) => {
			return updateContainer(reactElement, root)
		}
	}
}
