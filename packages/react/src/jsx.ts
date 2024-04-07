import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol'
import {
	type Ref,
	type Type,
	type ReactElement as ReactElementType,
	type Props,
	type Key,
	ElementType
} from 'shared/ReactTypes'

const ReactElement = function (type: Type, key: Key, ref: Ref, props: Props) {
	const element: ReactElementType = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__mark__: 'MMAARRKK'
	}
	return element
}

export const jsx = function (type: ElementType, config: any, ...children: any) {
	let key: Key = null
	let ref: Ref = null
	const props: Props = {}
	Object.entries(config ?? {}).forEach(([_key, value]) => {
		if (_key === 'key' && value !== undefined) {
			key = value + ''
			return
		}
		if (_key === 'ref' && value !== undefined) {
			ref = value
			return
		}

		props[_key] = value
	})

	const childrenCount = children.length

	if (children.length === 1) {
		props['children'] = children[0]
	} else if (childrenCount) {
		props['children'] = children
	}

	return ReactElement(type, key, ref, props)
}
export const jsxDEV = function (type: ElementType, config: any) {
	let key: Key = null
	let ref: Ref = null
	const props: Props = {}
	Object.entries(config).forEach(([_key, value]) => {
		if (_key === 'key' && value !== undefined) {
			key = value + ''
			return
		}
		if (_key === 'ref' && value !== undefined) {
			ref = value
			return
		}

		props[_key] = value
	})

	return ReactElement(type, key, ref, props)
}
