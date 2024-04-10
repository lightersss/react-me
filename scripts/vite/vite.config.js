import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolvePkgPath } from '../utils'
import path from 'path'
console.log(resolvePkgPath('react'))
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: [
			{
				find: 'react',
				replacement: resolvePkgPath('react')
			},
			{
				find: 'react-dom',
				replacement: resolvePkgPath('react-dom')
			},
			{
				find: 'react-reconciler',
				replacement: resolvePkgPath('react-reconciler')
			},
			{
				find: 'shared',
				replacement: resolvePkgPath('shared')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(resolvePkgPath('react-dom'), './src/hostConfig.ts')
			}
		]
	}
})
