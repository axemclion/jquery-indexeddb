/* global module:false */
module.exports = function(grunt) {
	// Project configuration.
	var saucekey = null;
	if (typeof process.env.saucekey !== "undefined") {
		saucekey = process.env.saucekey;
	}
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
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
					jshintrc: '.jshintrc'
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
				banner: '/*! <%= pkg.name %>  v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				sourceMap: 'dist/<%= (pkg.name).replace(/-/g, ".") %>.min.map',
				sourceMapRoot: 'http://nparashuram.com/jquery-indexeddb/',
				sourceMappingURL: 'http://nparashuram.com/jquery-indexeddb/dist/<%=pkg.name%>.min.map'
			},
			main: {
				files: {
					'dist/<%= (pkg.name).replace(/-/g, ".")%>.min.js': ['src/jquery.indexeddb.js']
				}
			}
		},
		watch: {
			all : {
				files: ['src/*.js'],
				tasks: ['uglify']
			}
		},
		clean: {
			dist: ['./dist']
		}
	});

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
				headers: {
					'User-Agent': 'Travis'
				},
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

	// Loading dependencies
	for (var key in grunt.file.readJSON('package.json').devDependencies) {
		if (key !== 'grunt' && key.indexOf('grunt') === 0) grunt.loadNpmTasks(key);
	}

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