import * as fs from 'fs'
import * as path from 'path'
import * as gulp from 'gulp'
import * as types from '@types'

import { getNamespacePathes, getNamespaceByComponent } from '../namespaces'
import { setDisplayName } from '../setDisplayName'
import { getComponent } from '../components'
import { warn, __ } from '../logger'
import { mkdir } from '../directories'

const { APP_COMPONENTS_DIR } = process.env

interface Compilers {
	global: ReturnType<types.Compiler>
	page: types.Compiler
}

export const watchComponents = (files: string, compilers: Compilers) => {
	mkdir(APP_COMPONENTS_DIR)

	gulp
		.watch(files, {
			ignoreInitial: true,
			ignored: /(^|[\/\\])\../,
		})
		.on('change', (file: string) => {
			const fileExt = path.extname(file).replace('.', '')
			const fileName = path.basename(path.dirname(file))
			const fileCategory = path.basename(path.dirname(path.dirname(file)))
			const component = getComponent(fileCategory, fileName)
			const namespace = getNamespaceByComponent(component)

			if (namespace === 'global') {
				gulp.series(compilers.global)(null)
			} else if (namespace !== 'none') {
				const pathes = getNamespacePathes(namespace)
				let path: string, type: string

				if (fileExt === 'pug' && fs.existsSync(pathes.pugFile)) {
					path = pathes.pugFile
					type = 'html'
				}

				if (fileExt === 'scss' && fs.existsSync(pathes.scssFile)) {
					path = pathes.scssFile
					type = 'style'
				}

				if (fileExt === 'js' && fs.existsSync(pathes.jsFile)) {
					path = pathes.jsFile
					type = 'script'
				}

				if (path) {
					gulp.series(
						setDisplayName(
							__('TASK_COMPILER_COMPONENT', {
								name: component,
								type,
								namespace,
							}),
							compilers.page(path)
						)
					)(null)
				} else {
					warn(
						__('WARN_COMPILER_COMPONENTDIR', {
							ext: fileExt,
						})
					)
				}
			}
		})
}
