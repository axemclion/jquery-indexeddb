var prettyCode = function(code) {
	if (typeof code === "function") {
		code = code.toString();
	}
	code = code || "";
	var start = "function (){";
	code = code.substring(code.indexOf(start) + start.length + 2, code.length - 1).replace(/(^\s+|$\s+)/g, "");
	return code;
};

/**
 * Load all dependent URLs
 */

var getUrls = function(container, callback) {
	var base = $("script[src*=demoer\\.js]").attr("src");
	base = base.substring(0, base.lastIndexOf("demoer.js"));

	// Loading Firebug
	var E = document.createElement('script');
	E.setAttribute('id', "FirebugLite");
	//E.setAttribute("src", "http://localhost/software/firebug-lite/build/firebug-lite.js#startOpened")
	E.setAttribute('src', "https://getfirebug.com/firebug-lite.js#startOpened");
	E.setAttribute("FirebugLite", "4");
	document.getElementsByTagName('body')[0].appendChild(E);
	var count = 0;
	var timerHandle = window.setInterval(function() {
		count++;
		if (count > 10) {
			window.clearInterval(timerHandle);
		}
		if (typeof firebug !== "undefined") {
			window.clearInterval(timerHandle);
			window.console = firebug;
			var firebugUI = document.getElementById("FirebugUI");
			if (firebugUI) {
				firebugUI.style.position = "static";
			}
		}
	}, 1000);

	// Loading beautify, and then the container
	$.getScript(base + "beautify.js", function() {
		$(container).load(base + "demoer.html", function() {
			callback();
		});
	});

	$("head").append($("<link>").attr({
		"type" : "text/css",
		"rel" : "stylesheet",
		"href" : base + "demoer.css"
	}));

}

// Start populating the samples
var loadDemoes = function(container, exampleList) {
	getUrls(container, function() {
		var exampleDiv = $(container).children("ul.examples:first");
		var template = exampleDiv.children("li.sample:first");
		var list = [];
		for (example in exampleList) {
			var exampleItem = template.clone(false).attr("id", example);
			var html = exampleItem.html().replace(/__EXAMPLE__/g, example);
			html = html.replace(/\s*__EXAMPLE_CODE__\s*/g, js_beautify(prettyCode(exampleList[example].code)));
			html = html.replace(/\s*__EXAMPLE_ALTERNATE__\s*/g, js_beautify(prettyCode(exampleList[example].alternate)));
			exampleItem.html(html);
			exampleDiv.append(exampleItem.removeClass("sample"));
		}
	});

	var run = function(code, title) {
		console.group(title);
		eval(code);
		setTimeout(function() {
			console.groupEnd(title);
		}, 1000);
		$(".more-code").hide();
	}

	$("a.example-more-code").live("click", function(e) {
		$(this).parent().nextAll(".code-full").toggle();
	});

	$("button.code-run").live("click", function(e) {
		run($(this).nextAll(".code").val(), $(this).parent().siblings(".example-name").children("a.example-title").html());
	});
};