import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

const App = () => {
	const [state] = useState(100)
	return <div>{state}</div>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
// console.log(React)
