/* global module:false */
module.exports = function(grunt) {
	// Project configuration.
	var saucekey = null;
	if (typeof process.env.saucekey !== "undefined") {
		saucekey = process.env.saucekey;
	}
	grunt.initConfig({
		pkg: '<json:package.json>',
		connect: {
			server: {
				options: {
					base: '.',
					port: 8080
				}
			}
		},

		'saucelabs-qunit': {
			all: {
				username: 'indexeddbshim',
				key: saucekey,
				tags: ['master'],
				urls: ['http://127.0.0.1:8080/test/index.html'],
				browsers: [{
					browserName: 'chrome'
				}, {
					browserName: 'internet explorer',
					platform: 'Windows 2012',
					version: '10'
				}]
			}
		},

		jshint: {
			all: {
				files: {
					src: ['grunt.js', 'test/**/*.js']
				},
				options: {
					camelcase: true,
					nonew: true,
					curly: true, // require { }
					eqeqeq: true, // === instead of ==
					immed: true, // wrap IIFE in parentheses
					latedef: true, // variable declared before usage
					newcap: true, // capitalize class names
					undef: true, // checks for undefined variables
					regexp: true,
					evil: true,
					eqnull: true, // == allowed for undefined/null checking
					expr: true, // allow foo && foo()
					browser: true // browser environment
				},
				globals: {
					DEBUG: true,
					console: true,
					require: true,
					jQuery: true,
					module: true,

					// Tests.
					_: true,
					asyncTest: true,
					DB: true,
					dbVersion: true,
					deepEqual: true,
					equal: true,
					expect: true,
					fail: true,
					module: true,
					nextTest: true,
					notEqual: true,
					ok: true,
					sample: true,
					start: true,
					stop: true,
					queuedAsyncTest: true,
					queuedModule: true,
					unescape: true,
					process: true
				}
			}
		},

		groundskeeper: {
			main: {
				files: {
					'dist/jquery.indexeddb.js': ['src/jquery.indexeddb.js']
				},
				options: {
					console: false,
					debugger: false
				}
			}
		},

		uglify: {
			options: {
				report: 'gzip',
			},
			main: {
				files: {
					'dist/jquery.indexeddb.min.js': ['src/jquery.indexeddb.js']
				}
			}
		},
		watch: {}
	});

	grunt.loadNpmTasks('grunt-saucelabs');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-groundskeeper');

	grunt.registerTask("publish", function() {
		var done = this.async();
		console.log("Running publish action");
		var request = require("request");
		request("https://api.travis-ci.org/repos/axemclion/jquery-indexeddb/builds.json", function(err, res, body) {
			var commit = JSON.parse(body)[0];
			var commitMessage = ["Commit from Travis Build #", commit.number, "\nBuild - https://travis-ci.org/axemclion/jquery-indexeddb/builds/", commit.id, "\nBranch : ", commit.branch, "@ ", commit.commit];
			console.log("Got Travis Build details");
			request({
				url: "https://api.github.com/repos/axemclion/jquery-indexeddb/merges?access_token=" + process.env.githubtoken,
				method: "POST",
				body: JSON.stringify({
					"base": "gh-pages",
					"head": "master",
					"commit_message": commitMessage.join("")
				})
			}, function(err, response, body) {
				console.log(body);
				done(!err);
			});
		});
	});

	var testJobs = ["build", "connect"];
	if (saucekey !== null) {
		testJobs.push("saucelabs-qunit");
	}

	if (process.env.CI && process.env.TRAVIS) {
		testJobs.push("publish");
	}
	testJobs.push("publish");

	grunt.registerTask('build', ['jshint', 'groundskeeper', 'uglify']);
	grunt.registerTask('test', testJobs);
	grunt.registerTask('default', 'build');
	grunt.registerTask('dev', ['build', 'connect', 'watch']);
};