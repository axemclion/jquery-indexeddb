(function($, undefined){
	$.extend({
		/**
		 * The IndexedDB object used to open databases
		 * @param {Object} dbName - name of the database
		 * @param {Object} config - version, onupgradeneeded, onversionchange, schema
		 */
		"indexedDB": function(dbName, config){
			var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
			var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
			var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
			
			if (config) {
				// Parse the config argument
				if (typeof config === "number") config = {
					"version": config
				};
				
				var version = config.version;
				if (config.schema && !version) {
					var max = -1;
					for (key in config.schema) {
						max = max > key ? max : key;
					}
					version = config.version || max;
				}
			}
			
			var wrap = {
				"request": function(req, args){
					return $.Deferred(function(dfd){
						try {
							var idbRequest = typeof req === "function" ? req(args) : req;
							idbRequest.onsuccess = function(e){
								//console.log("Success", idbRequest, e, this);
								dfd.resolveWith(idbRequest, [idbRequest.result, e]);
							};
							idbRequest.onerror = function(e){
								//console.log("Error", idbRequest, e, this);
								dfd.rejectWith(idbRequest, [idbRequest.error, e]);
							};
							if (typeof idbRequest.onblocked !== "undefined" && idbRequest.onblocked === null) {
								idbRequest.onblocked = function(e){
									//console.log("Blocked", idbRequest, e, this);
									dfd.notifyWith(idbRequest, [idbRequest.result, e]);
								};
							}
							if (typeof idbRequest.onupgradeneeded !== "undefined" && idbRequest.onupgradeneeded === null) {
								idbRequest.onupgradeneeded = function(e){
									//console.log("Upgrade", idbRequest, e, this);
									dfd.notifyWith(idbRequest, [idbRequest.result, e]);
								};
							}
						} catch (e) {
							e.name = "exception";
							dfd.rejectWith(idbRequest, ["exception", e]);
						}
					});
				},
				// Wraps the IDBTransaction to return promises, and other dependent methods
				"transaction": function(idbTransaction){
					return {
						"objectStore": function(storeName){
							try {
								return wrap.objectStore(idbTransaction.objectStore(storeName));
							} catch (e) {
								idbTransaction.readyState !== idbTransaction.DONE && idbTransaction.abort();
								return wrap.objectStore(null);
							}
						},
						"createObjectStore": function(storeName, storeParams){
							try {
								return wrap.objectStore(idbTransaction.db.createObjectStore(storeName, storeParams));
							} catch (e) {
								idbTransaction.readyState !== idbTransaction.DONE && idbTransaction.abort();
							}
						},
						"deleteObjectStore": function(storeName){
							try {
								idbTransaction.db.deleteObjectStore(storeName);
							} catch (e) {
								idbTransaction.readyState !== idbTransaction.DONE && idbTransaction.abort();
							}
						},
						"abort": function(){
							idbTransaction.abort();
						}
					};
				},
				"objectStore": function(idbObjectStore){
					var result = {};
					
					// Define CRUD operations
					var crudOps = ["add", "put", "get", "delete", "clear", "count"];
					for (var i = 0; i < crudOps.length; i++) {
						result[crudOps[i]] = (function(op){
							return function(){
								return wrap.request(function(args){
									return idbObjectStore[op].apply(idbObjectStore, args);
								}, arguments);
							}
						})(crudOps[i]);
					}
					
					result.each = function(callback, range, direction){
						return wrap.cursor(function(){
							return idbObjectStore.openCursor(wrap.range(range), direction);
						}, callback);
					};
					
					result.index = function(name){
						return wrap.index(function(){
							return idbObjectStore.index(name);
						});
					};
					
					result.createIndex = function(prop, indexName, options){
						return wrap.index(function(){
							return idbObjectStore.createIndex(indexName, prop, options);
						});
					};
					
					result.deleteIndex = function(indexName){
						return idbObjectStore.deleteIndex(indexName);
					}
					
					return result;
				},
				
				"range": function(r){
					if ($.isArray(r)) {
						if (r.length === 1) {
							return IDBKeyRange.only(r[0]);
						} else {
							return IDBKeyRange.bound(r[0], r[1], r[2] || true, r[3] || true);
						}
					} else {
						return r;
					}
				},
				
				"cursor": function(idbCursor, callback){
					return $.Deferred(function(dfd){
						try {
							var cursorReq = typeof idbCursor === "function" ? idbCursor() : idbCursor;
							cursorReq.onsuccess = function(e){
								if (!cursorReq.result) {
									dfd.resolveWith(cursorReq, [null, e]);
									return;
								}
								var elem = {
									// Delete, update do not move 
									"delete": function(){
										return wrap.request(function(){
											return cursorReq.result["delete"]();
										});
									},
									"update": function(data){
										return wrap.request(function(){
											return cursorReq.result["update"](data);
										});
									},
									"next": function(key){
										this.data = key;
									},
									"key": cursorReq.result.key,
									"value": cursorReq.result.value
								};
								dfd.notifyWith(cursorReq, [elem, e]);
								var result = callback.apply(cursorReq, [elem]);
								try {
									if (result === false) {
										dfd.resolveWith(cursorReq, [null, e]);
									} else if (typeof result === "number") {
										cursorReq.result["advance"].apply(cursorReq.result, [result]);
									} else {
										cursorReq.result["continue"].apply(cursorReq.result, [elem.data]);
									}
								} catch (e) {
									dfd.rejectWith(cursorReq, [cursorReq.result, e]);
								}
							};
							cursorReq.onerror = function(e){
								dfd.rejectWith(cursorReq, [cursorReq.result, e]);
							};
						} catch (e) {
							e.type = "exception";
							dfd.rejectWith(cursorReq, [null, e]);
						}
					});
				},
				
				"index": function(index){
					try {
						var idbIndex = (typeof index === "function" ? index() : index);
					} catch (e) {
						idbIndex = null;
					}
					//console.log(idbIndex, index);
					return {
						"each": function(callback, range, direction){
							return wrap.cursor(function(){
								return idbIndex.openCursor(wrap.range(range), direction);
							}, callback);
						},
						"eachKey": function(callback, range, direction){
							return wrap.cursor(function(){
								return idbIndex.openKeyCursor(wrap.range(range), direction);
							}, callback);
						}
					};
				}
			}
			
			// Start with opening the database
			var dbPromise = wrap.request(function(){
				//console.log("Trying to open DB with", version);
				return version ? indexedDB.open(dbName, version) : indexedDB.open(dbName);
			});
			dbPromise.then(function(db, e){
				//console.log("DB opened at", db.version);
				db.onversionchange = function(){
					// Try to automatically close the database if there is a version change request
					if (!(config && config.onversionchange && config.onversionchange() !== false)) {
						db.close();
					}
				};
			}, function(error, e){
				// Nothing much to do if an error occurs
			}, function(db, e){
				if (e && e.type === "upgradeneeded") {
					if (config && config.schema) {
						// Assuming that version is always an integer 
						//console.log("Upgrading DB to ", db.version);
						for (var i = e.oldVersion; i <= e.newVersion; i++) {
							typeof config.schema[i] === "function" && config.schema[i].call(this, wrap.transaction(this.transaction));
						}
					}
					if (config && typeof config.upgrade === "function") {
						config.upgrade.call(this, wrap.transaction(this.transaction));
					}
				}
			});
			
			return $.extend(dbPromise, {
				"cmp": function(key1, key2){
					return indexedDB.cmp(key1, key2);
				},
				"deleteDatabase": function(){
					// Kinda looks ugly coz DB is opened before it needs to be deleted. 
					// Blame it on the API 
					return $.Deferred(function(dfd){
						dbPromise.then(function(db, e){
							db.close();
							wrap.request(function(){
								return indexedDB.deleteDatabase(dbName);
							}).then(function(result, e){
								dfd.resolveWith(this, [result, e]);
							}, function(error, e){
								dfd.rejectWith(this, [error, e]);
							}, function(db, e){
								dfd.notifyWith(this, [db, e]);
							});
						}, function(error, e){
							dfd.rejectWith(this, [error, e]);
						}, function(db, e){
							dfd.notifyWith(this, [db, e]);
						});
					});
				},
				"transaction": function(storeNames, mode){
					mode = mode || 1;
					return $.Deferred(function(dfd){
						dbPromise.then(function(db, e){
							try {
								var idbTransaction = db.transaction(storeNames, mode);
								idbTransaction.onabort = idbTransaction.onerror = function(e){
									dfd.rejectWith(idbTransaction, [e]);
								};
								idbTransaction.oncomplete = function(e){
									dfd.resolveWith(idbTransaction, [e]);
								};
							} catch (e) {
								e.type = "exception";
								dfd.rejectWith(this, [e]);
							}
							try {
								dfd.notifyWith(idbTransaction, [wrap.transaction(idbTransaction)]);
							} catch (e) {
								e.type = "exception";
								dfd.rejectWith(this, [e]);
							}
						}, function(err, e){
							dfd.rejectWith(this, [e, err]);
						});
						
					});
				},
				"objectStore": function(storeName, mode){
					var me = this, result = {};
					
					function op(callback){
						return $.Deferred(function(dfd){
							me.transaction(storeName, mode).then(function(){
								// Nothing to do when transaction is complete
							}, function(err, e){
								// If transaction fails, CrudOp fails
								dfd.rejectWith(this, [err, e]);
							}, function(trans){
								try {
									callback(trans.objectStore(storeName)).then(function(result, e){
										dfd.resolveWith(this, [result, e]);
									}, function(err, e){
										dfd.rejectWith(this, [err, e]);
									});
								} catch (e) {
									e.name = "exception";
									dfd.rejectWith(trans, [e, e]);
								}
							});
						});
					};
					
					function crudOp(opName, args){
						return op(function(wrappedObjectStore){
							return wrappedObjectStore[opName].apply(wrappedObjectStore, args);
						});
					}
					
					function indexOp(opName, indexName, args){
						return op(function(wrappedObjectStore){
							var index = wrappedObjectStore.index(indexName);
							return index[opName].apply(index[opName], args);
						});
					}
					
					var crud = ["add", "delete", "get", "put", "clear", "count", "each"];
					for (var i = 0; i < crud.length; i++) {
						result[crud[i]] = (function(op){
							return function(){
								return crudOp(op, arguments);
							}
						})(crud[i]);
					}
					
					result.index = function(indexName){
						return {
							"each": function(callback, range){
								return indexOp("each", indexName, [callback]);
							},
							"eachKey": function(callback, range){
								return indexOp("eachKey", indexName, [callback]);
							}
						};
					}
					
					return result;
				}
			});
		}
	});
})(jQuery);
