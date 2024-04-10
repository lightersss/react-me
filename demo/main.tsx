import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

const Child = () => <div>child</div>

const App = () => {
	const [state, setState] = useState(1)
	window.setState = setState
	return <div>{state === 1 ? <Child /> : <span>{state}</span>}</div>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
// console.log(React)
