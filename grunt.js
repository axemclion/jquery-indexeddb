/* global module:false */
module.exports = function(grunt){
	// Project configuration.
	var saucekey = null;
	if (process.env.TRAVIS_SECURE_ENV_VARS) {
		saucekey = process.env.saucekey;
	}
	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '/*! <%= pkg.name %> */'
		},
		lint: {
			files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
		},
		
		server: {
			base: '.',
			port: 9999
		},
		
		qunit: {
			all: ['http://localhost:9999/test/index.html']
		},
		
		'saucelabs-qunit': {
			all: {
				username: 'indexeddbshim',
				key: saucekey,
				testname: 'jquery-indexeddb',
				tags: ['master'],
				urls: ['http://127.0.0.1:9999/test/index.html'],
				browsers: [{
					browserName: 'chrome'
				}]
			}
		},
		
		jshint: {
			options: {
				camelcase: true,
				nonew: true,
				curly: true,// require { }
				eqeqeq: true,// === instead of ==
				immed: true,// wrap IIFE in parentheses
				latedef: true,// variable declared before usage
				newcap: true,// capitalize class names
				undef: true,// checks for undefined variables
				regexp: true,
				evil: true,
				eqnull: true,// == allowed for undefined/null checking
				expr: true,// allow foo && foo()
				browser: true
				// browser environment
			},
			globals: {
				DEBUG: true,
				console: true,
				require: true,
				
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
		},
		uglify: {}
	});
	
	// Default task.
	grunt.loadNpmTasks('grunt-saucelabs');
	grunt.registerTask('build', 'lint');
	grunt.registerTask("forever", function(){
		this.async();
	});
	
	grunt.registerTask("publish", function(){
		var done = this.async();
		console.log("Running publish action");
		var request = require("request");
		request("https://api.travis-ci.org/repos/axemclion/jquery-indexeddb/builds.json", function(err, res, body){
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
			}, function(err, response, body){
				console.log(body);
				done(!err);
			});
		});
	});
	
	var testJobs = ["build", "server"];
	if (process.env.CI && process.env.TRAVIS) {
		if (saucekey !== null && !process.env.TRAVIS_PULL_REQUEST) {
			testJobs.push("saucelabs-qunit");
		}
		testJobs.push("publish");
	}
	
	grunt.registerTask('test', testJobs.join(" "));
	grunt.registerTask('default', 'build');
};
