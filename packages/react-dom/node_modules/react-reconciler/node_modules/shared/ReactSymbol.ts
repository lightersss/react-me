const supportSymbol = typeof Symbol === 'function' && Symbol.for
export const REACT_ELEMENT_TYPE = supportSymbol ? Symbol.for('react') : 0xeac7
