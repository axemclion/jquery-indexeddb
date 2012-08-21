Jquery-IndexedDB API Reference
===============================

List of APIs - Quick Reference

* [$.indexedDB()] (#openDatabase)
* [$.indexedDB(, schema)] (#openDatabaseUpgrade)
* [$.indexedDB().transaction()] (#transactionSec)
* [$.indexedDB().objectStore()] (#objectStore)
* [$.indexedDB().objectStore().add()] (#crud)
* [$.indexedDB().objectStore().each()] (#cursorEach)
* [$.indexedDB().objectStore().index()] (#index)
* [$.indexedDB().objectStore().deleteDatabase()] (#deleteDatabase) 

IndexedDB - Quick Intro
-------------------------
* [IndexedDB] (http://www.w3.org/TR/IndexedDB/) is a database inside a browser to save and retrieve objects on the browser/client.
* IndexedDB contains multiple `objectStores` (sort of tables) that contain data. 
	*  `objectStores` have data records in form of (key, javascript object) pairs. (key) uniquely identify records
	* Data can be written to, read from, or iterated over, inside and `object store`
	* (key, javascript object) pairs can also have indexes on a property in the (javascript object)
* Data operations can be scoped into transactions. 

Open Database <a name = "openDatabase"/>
----------------------------------------
Creates a new connection to the _Indexed Database_ specified as the name. 

``` javascript
var dbOpenPromise = $.indexedDB("database_name", { 
	// The second parameter is optional
	"version" : 3,  // Integer version that the DB should be opened with
	"upgrade" : function(transaction){
		// Function called when DB is of lower version that specified in the version parameter
		// See transaction for details on the argument
	},
	"schema" : {
		"1" : function(transaction){
			// List of instructions to run when DB version is upgraded to 1. 
			// See transaction for details on the argument
		},
		"2" : function(transaction){
			// Examples of using the transaction object
			var obj1 = transaction.objectStore("store1");
			var obj2 = transaction.createObjectStore(store2);
			obj1.createIndex("index");
		}
	}
});
```

<a name = "openDatabaseUpgrade"/>
When a `schema` parameter is specified, and if the DB is originally at version `1`, then only functions labeled `2` and above are executed. 
This provides a way to migrate database by creating object stores, indexes or even reading/writing data between database versions. 
For details on the `transaction` parameter, looks at the [Transaction] (#trans) object returned during a transaction. 

Note that the `createObjectStore`
and the `deleteObjectStore` are available only during the upgrade operations. 
Also, `objectStores` opened during progress can have `index` operations. See the [indexes] (#index) section for more details

If the optional parameter is not specified, it simply opens the database to the latest version available.  

It returns a [Jquery Promise] ("http://api.jquery.com/category/deferred-object/") with the following 
[done] (#dbOpenDone), [progress] (#dbOpenProgress) and [fail] (#dbOpenFail) event handlers. 

### Handling Database open success <a name = "dbOpenDone"/>

``` javascript
dbOpenPromise.done(function(db, event){
	// Called when the database is successfully opened. 
	db;  //  the native IndexedDB Database object (aka result of the IDBRequest) ,
	event; // the IndexedDB Event object.  
	this; // Context inside the function is the native IDBRequest.
});
```

### When the database open is in progress <a name = "dbOpenProgress"/>
When that database is being upgraded or is blocked due to another transaction being in progress 

``` javascript
dbOpenPromise.progress(function(db, event){
	// Called when there is the database open is in progress - when it is blocked or is being upgraded 
	error; // is the error object and has more details on what the error is
	event; //  is the IndexedDB Event object
	event.type; //indicates - blocked or upgrade
	this; // Context inside the function is the native IDBRequest
});
```
When a database open operation is blocked, you can choose to close the database. 
When the database is being upgraded, you can perform all actions permitted in the versionChange transaction.

### Handling database open error <a name = "dbOpenFail"/>

``` javascript
dbOpenPromise.fail(function(error, event){
	// Called when there is an error opening the database. 
	error; //is the error object and has more details on what the error is
	event; //is the IndexedDB Event object. event.type indicates the type - 'error' or 'exception'
	this; // Context inside the function is the native IDBRequest	
});
```
Transactions  <a name = "transactionSec"/>
--------------------------
Once a database is opened, read and write transactions can be performed within a transaction.

	var transactionPromise = $.indexedDB("dbName").transaction(storeNames, mode);

`storeNames` is an array of object store names (or a single string object store name) that should be under this transaction. 

<a name = "transactionMode"/> 
`mode` is 0 or 1 indication *READ_ONLY* or *READ_WRITE*, similar to [modes] (http://www.w3.org/TR/IndexedDB/#dfn-mode) in the IndexedDB Specification.  

The returned transaction promise has the following event handlers during the lifetime of the transaction.  

### Transaction in progress <a name = "transInProgress"/>
	
``` javascript
transactionPromise.progress(function(trans){
	// Called when the transaction has started
	trans; // Use the methods on the trans object (see below) to perform operations
});
```
	
<a name = "trans"/> The transaction object passed to the callback when transaction is in progress has the following methods on it. 

``` javascript
var objectStore = trans.objectStore("objectStoreName");
```

The following 2 methods are available only when the database is being upgraded. Look at the [Open Database Schema] (#openDatabaseUpgrade) section for details. 

``` javascript
var objectStore = trans.createObjectStore("objectStoreName", {
	// Options to create object store. 
	"autoIncrement" : true,  // [detaults to true], indicating that the key for this object store should auto increment,
	"keyPath" : id // the path of key in the object, defaults to key that has to be specified separately
}); 

trans.deleteObjectStore(objectStoreName); 
```
See [object stores] (#objectStore) for methods on the `objectStore` returned by the above calls.

### Transaction complete

``` javascript
transactionPromise.done(function(event){
	// Called when transaction is completed
	event; // Indicated the transaction complete event.
});
```

### Transaction fails or is aborted

``` javascript
transactionPromise.fail(function(event){
	// Called when the transaction is aborted or fails
	event.type; // indicates the reason for failure being error, exception or abort
});
```
 
Object Stores <a name = "objectStore"/>
----------------------------------------
Once the database is opened, operations need to be performed on object stores. 
An object store can be opened inside a [transaction that is in progress] (#transInProgress) or using a shorthand on the `$.indexedDB` object like. 

``` javascript
var objectStore = $.indexedDB("database_name").objectStore("objectStoreName", /* Optional */ mode );
``` 

The `mode` parameter defaults to READ_WRITE and is similar to the `mode` parameter specified during a `transaction`. 

As a convenience method, if the `mode` is set to `true` (instead of 0 or 1), an object store is created if it does not exist. Internally, the database is closed and opened with a higher version to trigger the version transaction where the object store can be created.  

<a name = "crud"/>
The above expression internally creates a transaction for this object store. The `mode` parameter is optional and similar to the [mode parameter] (#transactionMode) in transactions. 
The CRUD methods on the object store are 

```javascript
var promise = objectStore.add(/*Javascript Object*/ value, /*Optional*/ key); // Adds data to the objectStore
var promise = objectStore.get(key); Gets the object with the key 
var promise = objectStore.put(/*Javascript Object*/ value, key); // Updates the object for the specified key 
var promise = objectStore.delete(key); // Deletes the object with the specified key
var promise = objectStore.count(); // Gets all the objects
var promise = objectStore.clear(); // Removes all data from the object store;
```

The returned promise can be used to note the success or error of the operations 

``` javascript
promise.done(function(result, event){
	result; // Result of the operation. Some operations like delete will return undefined
	event; // Success Event
});

promise.fail(function(error, event){
	error; // Type of error that has occured
	event; // Error event
	event.type; // indicates if there was an error or an exception
});
```

<a name = "cursorEach"/>
To iterate over the objects inside an object store, use

``` javascript
var iterationPromise = objectStore.each(function(item){
	// Called for each element during the iteration
	item.key, item.value; // The key and the value of current object
	item.delete(); // Deletes the current item
	item.update(newItem); // Updates the current item with newItem;
	
	return; 
	// false - do not continue iteration
	// integer 'n' - n can be 1,2,... indicating skip next n objects and continue
	// object - continue to item with object as the next key
	// default - no return, or undefined return, continue iteration
	  
}, /*Optional*/ range, /*Optional*/ direction);

iterationPromise.done(function(result, event){
	// Iteration completed
	result ; // null, indicating that there are no more objects for iteration
	event ; // Success event
})

iterationPromise.fail(function(error, event){
	error; // Error during iteration
	event; // Error event, can be exception or event
});

```
`range` limits the results and can be an array like `[lower_limit, upper_limit, can_include_lower, can_include_upper]`.
If only one element is specified in the array, it becomes an equals clause. The parameters `can_include_lower` and `can_include_upper` are optional and default to true.

In addition to the above CURD operation, `objectStore.index` methods also allow operations using indexes. See [indexes] (#index) for details. 

Indexes <a name = "index"/>
---------------------------
Once a reference to an objectStore is obtained either using `transaction.objectStore()`, `transaction.createObjectStore()` or `$.indexedDB("").objectStore()`,
the index object can be used. 

``` javascript
	var index = objectStore.index("indexName");
	index.each(function(item){
		// Iterate over objects in index
		// Similar to iterating over objects in an ObjectStore
		item; // same as iterating over objects (see above) 
	}, /*Optional*/ range, /*Optional */ direction);
	
	index.eachKey(function(item){
		// 	Iterate over the keys of the object
	});
```

While upgrading a database in the [version change transaction] (openDatabaseUpgrade), indexes can also be created or deleted on an object store. 

```javascript
	// trans is created when a database upgrade is in progress
	var objectStore = trans.objectStore("objectStoreName");
	var index = objectStore.createIndex("object.property" , /*Optional*/ {
		"unique" : false, // Uniqueness of Index, defaults to false
		"multiEntry" : false // see explanation below
	}, /* Optional */ "indexName")
	objectStore.deleteIndex("indexName"); //returns nothing
	
```
If the second argument to the `createIndex` function is a string, it is considered to be the name of the index. If no indexName is specified in `createIndex`, the property name is used as indexName

This multiEntry flag affects how the index behaves when the result of evaluating the index's key path yields an Array.
 
* If the multiEntry flag is false, then a single record whose key is an Array is added to the index. 
* If the multiEntry flag is true, then the one record is added to the index for each item in the Array. The key for each record is the value of respective item in the Array. 

Delete Database <a name = "deleteDatabase"/>
-------------------------------
A database can be deleted using 

``` javascript
var deletePromise = $.indexedDB("database_name").deleteDatabase();

deletePromise.done(function(null, event){ 
	/* Called when the delete is successful*/
	event; // The success event
});
deletePromise.fail(function(error, event){ 
	/* Called when the delete is successful*/
	error; // Reason for the error
});
deletePromise.progress(function(db, event){ 
	// Called when the deleting is blocked due to another transaction
	db; // Database that is opened
	event.type // Indicates it is blocked, etc. 
});
```

Compare Keys
---------------------
A convenience method to compare keys in a database. Can be used as `$.indexedDB("dbName").cmp(key1, key2)` and return 1,0 or -1 when key1 is greater than, equal to or less than key2 respectively.  

Links
-------
Some useful links

* [IndexedDB W3C Specification] (http://www.w3.org/TR/IndexedDB/)
* [IndexedDB API playground and examples] (http://nparashuram.com/IndexedDB)
* [My work on IndexedDB] (http://blog.nparashuram.com/search/label/indexeddb)