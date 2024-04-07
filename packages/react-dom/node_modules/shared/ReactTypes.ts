export type Type = any
export type Key = any
export type Ref = any
export type Props = any
export type ElementType = any
export interface ReactElement {
	$$typeof: number | symbol
	type: ElementType
	key: Key
	ref: Ref
	props: Props
	__mark__: string
}
/**
 * @description
 * 更新状态时传入的参数类型
 * @example
 * setState(1)
 * setState(prev=>prev+1)
 */
export type SetStateAction<State> = State | ((prevState: State) => State)
