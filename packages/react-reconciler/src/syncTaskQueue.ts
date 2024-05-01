type cbFn = (...args: any[]) => void
let syncQueue: cbFn[] | null = null
let isFlushing = false

export function scheduleSyncCallback(cb: cbFn) {
	if (syncQueue === null) {
		syncQueue = [cb]
	} else {
		syncQueue.push(cb)
	}
}

export function flushSyncCallback() {
	if (!isFlushing) {
		isFlushing = true
		try {
			syncQueue?.forEach((cb) => cb())
			syncQueue = null
		} catch {
			console.log('flushSyncQueue error')
		} finally {
			isFlushing = false
		}
	}
}
