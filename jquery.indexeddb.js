"use strict";

(function($){
	$.extend({
		/**
		 * The IndexedDB object used to open databases
		 * @param {Object} dbName
		 * @param {Object} config
		 */
		"indexedDB": function(dbName, config){
			indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
			IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
			IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
			
			var promise = {
				/**
				 * Returns a DB Open
				 */
				db: function(dbName){
					return $.Deferred(function(dfd){
						console.debug("Starting DB Promise", arguments);
						var req = indexedDB.open(dbName);
						req.onsuccess = function(){
							console.debug("DB Promise resolved", req.result);
							dfd.resolve(req.result);
						};
						req.onerror = function(e){
							console.debug("DB Promise rejected", req.result);
							dfd.reject(e, req.error);
							return;
						};
						req.onblocked = function(e){
							dfd.reject(e, req.error);
						};
						req.onupgradeneeded = function(e){
							var db = req.result;
						}
					});
				},
				
				/**
				 * Returns a new transaction.
				 * @param {Object} dbPromise
				 * @param {Object} objectStoreNames
				 * @param {Object} transactionType
				 */
				transaction: function(dbPromise, objectStoreNames, transactionType){
					return $.Deferred(function(dfd){
						(typeof objectStoreNames === "string") && (objectStoreNames = [objectStoreNames]);
						dbPromise.then(function(db){
							console.debug("Transaction Promise started", db, objectStoreNames, transactionType);
							try {
								var transaction = db.transaction(objectStoreNames || [], transactionType || IDBTransaction.READ);
								transaction.oncomplete = function(){
									//TODO - Do something when the transaction is complete
								};
								transaction.onabort = transaction.onerror = function(e){
									// TODO - DO something when there is an error in the transaction, or the transaction is complete
								}
							} 
							catch (e) {
								console.debug("Error in transaction", e);
								dfd.reject(e, db);
								return;
							}
							dfd.resolve(transaction);
						}, dfd.reject);
					}).promise();
				},
				/**
				 * Returns an object store if available. If object store is not available, tries to create it.
				 * @param {Object} transactionPromise
				 * @param {Object} objectStoreName
				 * @param {Object} createOptions - if false, objectStore is not created. Undefined or Null creates out-of-line keys. An object with {autoincrement , keypPath} is passed directly to the create call
				 */
				objectStore: function(transactionPromise, objectStoreName, createOptions){
					return $.Deferred(function(dfd){
						transactionPromise.then(function(transaction){
							console.debug("ObjectStore Promise started", transactionPromise, objectStoreName, createOptions);
							try {
								var objectStore = transaction.objectStore(objectStoreName);
								console.debug("ObjectStore Promise completed", objectStore);
							} 
							catch (e) {
								console.debug("Object store not found", objectStoreName, e);
								try {
									if (createOptions === false) {
										console.debug("Could not create object", e);
										dfd.reject(e, transaction.db);
										return;
									}
									else {
										console.debug("Create options specified, so trying to create the database", createOptions);
										objectStore = transaction.db.createObjectStore(objectStoreName, createOptions);
										console.debug("Object Store created", objectStore);
										
									}
								} 
								catch (e) {
									console.debug("Error in Object Store Promise", e);
									dfd.reject(e, transaction.db);
									return;
								}
							}
							dfd.resolve(objectStore);
						}, dfd.reject);
					}).promise();
				},
				/**
				 * Returns a promise to remove an object store
				 * @param {Object} objectStoreName
				 */
				deleteObjectStore: function(transactionPromise, objectStoreName){
					return $.Deferred(function(dfd){
						transactionPromise.then(function(transaction){
							try {
								transaction.db.deleteObjectStore(objectStoreName);
								console.debug("Deleted object store", objectStoreName);
								dfd.resolve(transaction.db);
							} 
							catch (e) {
								console.debug("Could not delete ", objectStoreName)
								dfd.reject(e, transaction.db);
								return;
							}
						}, dfd.reject);
					}).promise();
				},
				/**
				 * Creates a cursor Promise
				 * @param {Object} sourcePromise - Object Store or Index
				 * @param {Object} range
				 * @param {Object} direction
				 */
				cursor: function(sourcePromise, range, direction, cursorType){
					if (!cursorType) {
						cursorType = "openCursor";
					}
					return $.Deferred(function(dfd){
						sourcePromise.then(function(source){
							console.debug("Cursor Promise Started", source);
							var req = source[cursorType](range, direction);
							req.onsuccess = function(){
								console.debug("Cursor Promise completed", req);
								dfd.resolve(req);
							};
							req.onerror = function(e){
								console.debug("Cursor Promise error", e, req);
								dfd.reject(e, req);
								return;
							};
						}, dfd.reject);
					}).promise();
				},
				/**
				 * Returns an index promise, or creates one if index does not exist
				 * @param {Object} indexName
				 * @param {Object} objectStorePromise
				 * @parasm {Object} transactionPromise is required as getting transaction.db.name is not supported in Chrome
				 */
				index: function(indexName, objectStorePromise, transactionPromise){
					return $.Deferred(function(dfd){
						objectStorePromise.then(function(objectStore){
							console.debug("Index Promise started", objectStore)
							try {
								var index = objectStore.index(indexName + "-index");
								console.debug("Index Promise completed", index);
								dfd.resolve(index);
							} 
							catch (e) {
								transactionPromise.then(function(transaction){
									var name = transaction.db.name;
									transaction.abort();
									transaction.db.close();
									console.debug("Index Promise requires version change");
									$.when(promise.versionTransaction(promise.db(name))).then(function(transaction){
										console.debug("Index Promise version change transaction started", transaction);
										try {
											var index = transaction.objectStore(objectStore.name).createIndex(indexName + "-index", indexName);
											transaction.oncomplete = function(){
												transaction.db.close();
											}
											console.debug("Index Promise completed", index);
											dfd.resolve(index);
										} 
										catch (e) {
											console.debug("Index Promise Failed", e);
											dfd.reject(e, transaction);
											return;
										}
									}, dfd.reject);
								}, dfd.reject);
							}
						}, dfd.reject);
					}).promise();
				},
			}//end of promise object
			/**
			 * Returns an objectStore promise with openCursor, etc.
			 * @param {Object} objectStoreName
			 * @param {Object} canCreate - false: don't create, true|undefined:create with default path, object:create with options
			 */
			var objectStore = function(transactionPromise, objectStoreName, createOptions){
				var objectStorePromise = $.Deferred(function(dfd){
					if (typeof createOptions === "undefined") {
						createOptions = {
							"autoIncrement": true
						};
					}
					$.when(promise.objectStore(transactionPromise, objectStoreName, createOptions)).then(function(objectStore){
						dfd.resolve(objectStore);
					}, function(e, db){
						$.when(promise.objectStore(promise.versionTransaction(dbPromise), objectStoreName, createOptions)).then(function(objectStore){
							dfd.resolve(objectStore);
						}, dfd.reject);
					}, dfd.reject);
				}).promise();
				
				var crudOp = function(op, args){
					return $.Deferred(function(dfd){
						objectStorePromise.then(function(objectStore){
							try {
								//TODO : Accept all args that are sent
								var req = objectStore[op](args[0], args[1]);
								req.onsuccess = function(event){
									console.debug("Performed", op, req.result);
									dfd.resolve(req.result);
								};
								req.onerror = function(e){
									console.debug("Error performing", op, e, req);
									dfd.reject(e, req);
									return;
								}
							} 
							catch (e) {
								console.debug("Exception in ", op, e, req);
								dfd.reject(e, req);
								return;
							}
						}, dfd.reject);
					}).promise();
				};
				
				var result = objectStorePromise;
				$.extend(result, {
					"openCursor": function(range, direction){
						return cursor(objectStorePromise, range, direction);
					},
					"index": function(indexName){
						/*
					 *  Transaction promise is required here because when creating a new index, Chrome does not let us get
					 *  transaction.db from the object Store.
					 */
						var indexResult = indexPromise = promise.index(indexName, objectStorePromise, transactionPromise);
						return {
							"openCursor": function(range, direction){
								return cursor(indexPromise, range, direction);
							},
							"openKeyCursor": function(range, direction){
								return cursor(indexPromise, range, direction, "openKeyCursor");
							}
						};
					},
					"add": function(data, key){
						return crudOp("add", [data, key]);
					},
					"delete": function(data){
						return crudOp("delete", [data]);
					},
					"remove": function(data){
						return crudOp("delete", [data]);
					},
					"get": function(data){
						return crudOp("get", [data]);
					},
					"update": function(data, key){
						return crudOp("put", [data, key]);
					},
					"put": function(data, key){
						return crudOp("put", [data, key]);
					}
				});
				return result;
			};
			/**
			 * Defines the bounds of a cursor range
			 * @param {Object} range
			 */
			var bounds = function(range){
				var result = range;
				if ($.isArray(range)) {
					if (range[0] && range[1]) result = new IDBKeyRange.bound(range[0], range[1], range[2] || true, range[3] || true);
					else if (range[0] && !range[1]) result = new IDBKeyRange.lowerBound(range[0], range[2] || true);
					else if (!range[0] && range[1]) result = new IDBKeyRange.upperBound(range[1], range[3] || true);
				}
				return result;
			};
			/**
			 * Returns a cursor object with each, getAll, etc.
			 * @param {Object} sourcePromise
			 * @param {Object} range
			 * @param {Object} direction
			 */
			var cursor = function(sourcePromise, range, direction, type){
				var cursorPromise = promise.cursor(sourcePromise, bounds(range), direction, type);
				function loop(callback, canDelete){
					cursorPromise.then(function(cursorRequest){
						function iterator(){
							if (cursorRequest.result) {
								var result = callback(cursorRequest.result.value, cursorRequest.result.key);
								if (canDelete && result) {
									cursorRequest.result["delete"]();
								}
								else if (result) {
									cursorRequest.result.update(result);
								}
								cursorRequest.result["continue"]();
							}
							cursorRequest.onsuccess = iterator;
						}
						cursorRequest.onsuccess = iterator;
						iterator();
					}, function(e, req){
						console.debug("Could not open cursor", e, req);
					});
				};
				var result = cursorPromise;
				$.extend(result, {
					/**
				 * Updates each element when iterating on the cursor
				 * @param {Object} callback
				 * @param {Object} canDelete
				 */
					updateEach: loop,
					/**
				 * Iterates over each element
				 * @param {Object} callback
				 */
					"each": function(callback){
						loop(function(val, key){
							callback(val, key);
							return false;
						});
					},
					/**
				 * Deletes each element if callback returns true
				 * @param {Object} callback
				 */
					"deleteEach": function(callback){
						loop(function(val, key){
							return callback(val, key);
						}, true);
					}
				});
				return result;
			}; //end of cursor
			/**
			 * Actual variabled defined in the $.indexedDB object
			 */
			return $.extend(promise.db(dbName), {
			
				/**
			 * Closes the current database connection and then deleted the database
			 */
				"deleteDatabase": function(){
				
				},
				
				/**
			 * Compares the first and the second key
			 * @param {Object} first key to compare
			 * @param {Object} second key to compare
			 */
				"cmp": function(first, second){
				
				},
				
				
				/**
			 * Creates a new transaction that can be used to create
			 * @param {Object} objectStoreNames
			 * @param {Object} transactionType - IDBTransaction.
			 */
				"transaction": function(objectStoreNames, transactionType){
					return $.extend(promise.transaction(dbPromise, objectStoreNames, transactionType), {
						"objectStore": function(objectStoreName, canCreate){
							return this.objectStore(transactionPromise, objectStoreName, canCreate);
						}
					});
				},
				
				/**
			 * Returns a connection to the object store. This can be used to perform various functions on the object store
			 * @param {Object} objectStoreName
			 * @param {Object} canCreate
			 */
				"objectStore": function(objectStoreName, canCreate){
					var transactionPromise = promise.transaction(dbPromise, objectStoreName, IDBTransaction.READ_WRITE);
					return objectStore(transactionPromise, objectStoreName, canCreate);
				}
			});//end of return values for indexedDB()
		}
	});
})(jQuery);
