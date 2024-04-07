import { Container } from 'hostConfig'
import { FiberNode, FiberRootNode } from './fiber'
import { workTags } from './workTags'
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from './updateQueue'
import { ReactElement as ReactElementType } from 'shared/ReactTypes'
import { scheduleUpdateOnFiber } from './workLoop'

/**
 * @description
 * createRoot时会调用，创建container
 */
function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(workTags.HostRoot, {}, null)
	const root = new FiberRootNode(container, hostRootFiber)
	hostRootFiber.updateQueue = createUpdateQueue()
	return root
}
/**
 * @description 处理 hostRootFiber 的 updateQueue，把App组件作为 update 挂载 hostRootFiber 的 update 下
 * @param reactElement
 * @param root
 * @returns
 */
function updateContainer(reactElement: ReactElementType, root: FiberRootNode) {
	const hostRootFiber = root.current
	const update = createUpdate(reactElement)
	enqueueUpdate(hostRootFiber.updateQueue as UpdateQueue<ReactElementType>, update)
	scheduleUpdateOnFiber(hostRootFiber)
	return reactElement
}

export { createContainer, updateContainer }
