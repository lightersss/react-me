import { parsePackageJson, resolvePkgPath } from '../utils'
import ts from 'rollup-plugin-typescript2'
import generatePackageJson from 'rollup-plugin-generate-package-json'
import replace from '@rollup/plugin-replace'
import alias from '@rollup/plugin-alias'

const { name, module, peerDependencies } = parsePackageJson('react-dom')
const packagePath = resolvePkgPath(name)
const distPath = resolvePkgPath(name, true)
export default [
	{
		input: `${packagePath}/${module}`,
		output: [
			{
				file: distPath + '/index.js',
				name: 'ReactDom',
				format: 'umd'
			},
			{
				file: distPath + '/client.js',
				name: 'ReactDom',
				format: 'umd'
			}
		],
		external: [...Object.keys(peerDependencies)],
		plugins: [
			alias({
				entries: {
					hostConfig: `${packagePath}/src/hostConfig.ts`
				}
			}),
			ts(),
			generatePackageJson({
				inputFolder: packagePath,
				outputFolder: distPath,
				baseContents: ({ name, description, main, module }) => ({
					name,
					description,
					main: main?.replace(/.ts$/, '.js'),
					module: module?.replace(/.ts$/, '.js')
				})
			}),
			replace({
				__DEV__: true
			})
		]
	},
	{
		input: `${packagePath}/test-utils.ts`,
		output: [
			{
				file: `${distPath}/test-utils.js`,
				name: 'testUtils',
				format: 'umd'
			}
		],
		external: ['react', 'react-dom'],
		plugins: [
			alias({
				entries: {
					hostConfig: `${packagePath}/src/hostConfig.ts`
				}
			}),
			ts(),

			replace({
				__DEV__: true
			})
		]
	}
]
