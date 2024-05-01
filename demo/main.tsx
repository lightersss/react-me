import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

const App = () => {
	const [num, setNum] = useState(1)

	return (
		<div
			onClick={() => {
				setNum(function a(v) {
					console.log('a')
					return v + 1
				})
				setNum(function b(v) {
					console.log('b')

					return v + 1
				})
				setNum(function c(v) {
					console.log('c')

					return v + 1
				})
			}}
		>
			{num}
		</div>
	)
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
// console.log(React)
