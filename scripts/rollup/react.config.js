import { parsePackageJson, resolvePkgPath } from '../utils'
import ts from 'rollup-plugin-typescript2'
import generatePackageJson from 'rollup-plugin-generate-package-json'
import replace from '@rollup/plugin-replace'

const { name, module } = parsePackageJson('react')
const packagePath = resolvePkgPath(name)
const distPath = resolvePkgPath(name, true)
export default [
	{
		input: `${packagePath}/${module}`,
		output: {
			dir: distPath,
			name: 'React',
			format: 'umd'
		},
		plugins: [
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
		input: `${packagePath}/src/jsx.ts`,
		output: [
			{
				file: `${distPath}/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime',
				format: 'umd'
			},
			{
				name: 'jsx-runtime',
				file: `${distPath}/jsx-runtime.js`,
				format: 'umd'
			}
		],
		plugins: [ts()]
	}
]
