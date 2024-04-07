import ReactDOM from 'react-dom'

export function renderIntoDocument(element) {
	const div = document.createElement('div')
	// None of our tests actually require attaching the container to the
	// DOM, and doing so creates a mess that we rely on test isolation to
	// clean up, so we're going to stop honoring the name of this method
	// (and probably rename it eventually) if no problems arise.
	// document.documentElement.appendChild(div);
	// @ts-ignore
	return ReactDOM.createRoot(element).render(div)
}
