//
enum fiberFlags {
	NoFlags =       0b0000000,
	Placement =     0b0000001,
	Update =        0b0000010,
	ChildDeletion = 0b0000100
}
export default fiberFlags

export enum fiberMask {
	Mutation = fiberFlags.Placement | fiberFlags.Update | fiberFlags.ChildDeletion
}
