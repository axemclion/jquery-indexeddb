Jquery-IndexedDB API Reference
===============================

`$.indexedDB(dbName, configuration)`
----------------------------------
Creates a new connection to the _Indexed Database_. 

* `dbName` is the name of the database that should be open. According to the IndexedDB specification, it is created if it does not exist.
* `configuration` is a optional object with the following fields
	* `version` : The version to which a DB should be opened. This cannot be lesser than the version of the DB.
	* `upgrade`	: If this exists, it is called when the version of the DB on the browser needs to be upgraded to a higher version.
	* `schema`  : 
* returns a promise with the associated events
	* `done(database, event)` : The IndexedDB has opened. The `database` parameter is the result of the IDBOpenRequest and holds the native IndexedDB object 
	* `fail(error, event)` : If opening the database fails, an error, and the corresponding event are specified.
	* `progress(database, event)`: Event when the database is 

### Examples ###
>Open a database to the latest version. 

	$.indexedDB("dbName");

>Open a database with a defined schema.

	$.indexedDB("dbName", {
		"1" : function(transaction){
			transaction.createObjectStore("objectStore1");
		},
		"2" : function(transaction){
			transaction.objectStore("objectStore1").createIndex("index1");
		}
	});

