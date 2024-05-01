import { FiberRootNode } from './fiber'

export type Lane = number
export type Lanes = number
export const mergeLans = (laneA: Lane, laneB: Lane) => laneA | laneB
export const SyncLane = 0b0001
export const NoLane = 0b0000
export const NoLanes = 0b0000

export const requestUpdateLane = () => SyncLane

export const getHighestPriorityLane = (lanes: Lanes): Lane => lanes & -lanes

export const markRootFinished = (root: FiberRootNode, lane: Lane) => {
	root.pendingLans &= ~lane
}
