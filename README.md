Jquery Plugin for the IndexedDB API [![Build Status](https://secure.travis-ci.org/axemclion/jquery-indexeddb.png?branch=master)](https://travis-ci.org/axemclion/jquery-indexeddb)
===============================================================================================================================================================================

IndexedDB is a database inside a browser to save and retrieve objects on the browser/client. The JQuery IndexedDB Plugin is a wrapper on the IndexedDB API for JQuery. 

Links
------

* Home page - http://nparashuram.com/jquery-indexeddb/index.html
* Download the plugin - http://nparashuram.com/jquery-indexeddb/jquery.indexeddb.js
* Sample application - http://nparashuram.com/jquery-indexeddb/example/index.html
* API Documentation - https://github.com/axemclion/jquery-indexeddb/blob/gh-pages/docs/README.md

Summary
-------
The Jquery IndexedDB Plugin brings to goodness of Jquery to the browser's native IndexedDB API. It supports method chaining, promises and smart defaults, enabling you to get more done with less code. It also abstracts out differences in browser implementations.  

Code
----
The code written with the jQuery plugin is pretty simple. It looks something like 

```javascript
    $.indexeddb("BookShop-1").objectStore("BookList").openCursor().each(write); 
```


A typical operation using the IndexedDB API would involve using the request model, creating transactions, checking for existence of object store using error responses and exceptions and then finally getting to the part where the data is actually iterated over.  

```javascript
    var request = window.indexedDB.open("BookShop-1");
    request.onsuccess = function(event){
        var db = request.result;
        var transaction = db.transaction(["BookList"], IDBTransaction.READ_WRITE);
        var objectStore = transaction.objectStore("BookList");
        var request = DAO.objectStore.openCursor();
        request.onsuccess = function(event){
            var cursor = request.result;
            if (cursor) {
              write(cursor.key + "" + cursor.value);
              cursor["continue"]();                
            }
        };
    };

```

Read more about the API syntax in the [documentation](https://github.com/axemclion/jquery-indexeddb/blob/master/docs/README.md). 


Building
--------

Node is required to build this project.

* `npm insall -g grunt-cli` # to install the grunt command line
* `npm install` # to install all other dependencies from the package.json
* Run one of the following grunt commands
  * `grunt` # to just minify, lint and build the source. Final file available in `dist/` folder
  * `grunt dev` # to start a web server. Navigate to `http://127.0.0.1:8080/test/` to run Qunit tests

