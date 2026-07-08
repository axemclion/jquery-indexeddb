/* global module:false */
"use strict";
module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		connect: {
			server: {
				options: {
					base: '.',
					port: 8080,
					keepalive: true
				}
			}
		},

		'saucelabs-qunit': {
			all: {
				options: {
					username: 'indexeddbshim',
					key: process.env.SAUCE_ACCESS_KEY || '',
					tags: ['master'],
					urls: ['http://127.0.0.1:8080/test/index.html'],
					browsers: [{
							browserName: 'chrome'
						}, {
							browserName: 'internet explorer',
							platform: 'Windows 2012',
							version: '10'
						}
					]
				}
			}
		},

		jshint: {
			all: {
				files: {
					src: ['Gruntfile.js', 'test/**/*.js']
				},
				options: {
					jshintrc: '.jshintrc'
				}
			}
		},

		uglify: {
			options: {
				report: 'gzip',
				banner: '/*! <%= pkg.name %>  v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				sourceMap: 'dist/<%= (pkg.name).replace(/-/g, ".") %>.min.map',
				sourceMapRoot: 'http://nparashuram.com/jquery-indexeddb/',
				sourceMappingURL: 'http://nparashuram.com/jquery-indexeddb/dist/<%=pkg.name%>.min.map'
			},
			// Replaces the old grunt-groundskeeper step (abandoned since 2014,
			// pinned to grunt ~0.4.0): strip console/debugger statements only,
			// keep the rest readable, since dist/jquery.indexeddb.js (unminified)
			// is loaded directly by the tests and demos.
			unminified: {
				options: {
					compress: { drop_console: true, drop_debugger: true },
					mangle: false,
					sourceMap: false,
					beautify: true
				},
				files: {
					'dist/jquery.indexeddb.js': ['src/jquery.indexeddb.js']
				}
			},
			main: {
				files: {
					'dist/<%= (pkg.name).replace(/-/g, ".")%>.min.js': ['dist/jquery.indexeddb.js']
				}
			}
		},
		watch: {
			all: {
				files: ['src/*.js'],
				tasks: ['uglify']
			}
		},
		clean: {
			dist: ['./dist']
		}
	});

	// Loading dependencies
	for (var key in grunt.file.readJSON('package.json').devDependencies) {
		if (key !== 'grunt' && key.indexOf('grunt') === 0) {
			grunt.loadNpmTasks(key);
		}
	}

	var testJobs = ["build", "connect"];
	if (typeof process.env.SAUCE_ACCESS_KEY !== 'undefined') {
		testJobs.push("saucelabs-qunit");
	}

	grunt.registerTask('build', ['jshint', 'uglify:unminified', 'uglify:main']);
	grunt.registerTask('test', testJobs);
	grunt.registerTask('default', 'build');
	grunt.registerTask('dev', ['build', 'connect', 'watch']);
};