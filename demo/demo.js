function data(){
	return {
		"bookName": "bookName-" + parseInt(Math.random() * 100),
		"price": parseInt(Math.random() * 1000),
		"checkedOut": new Date()
	}
};

window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
var dbDeleteRequest = indexedDB.deleteDatabase("BookShop1");
dbDeleteRequest.onsuccess = function(e){
};

$.indexedDB("BookShop1", {
	"schema": {
		1: function(versionTransaction){
			versionTransaction.createObjectStore("OldBookList", {
				"autoIncrement": true
			});
			versionTransaction.createObjectStore("TempBookList");
		}
	}
});

var jqueryIndexedDB_Test = {
	"Create Object Store": {
		"code": function(){
			$.indexedDB("BookShop1", {
				"schema": {
					2: function(v){
						var objectStore = v.createObjectStore("BookList", {
							"keyPath": "id",
							"autoIncrement": true
						});
						objectStore.createIndex("price");
						console.info("Created new object store");
					}
				}
			}).then(console.info, console.error);
		},
		
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var req = db.setVersion((isNaN(parseInt(db.version, 10)) ? 0 : parseInt(db.version, 10) + 1));
				req.onsuccess = function(){
					var transaction = req.result;
					var objectStore = transaction.db.createObjectStore("BookList", {
						"keyPath": "id",
						"autoIncrement": true
					});
					objectStore.createIndex("price");
					console.info(objectStore);
				};
				req.onerror = function(e){
					console.error(e, req);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Delete Object Store": {
		"code": function(){
			$.indexedDB("BookShop1", 3).then(console.info, console.error, function(v){
				v.deleteObjectStore("TempBookList");
				console.info("Object Store deleted");
			});
		},
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var req = db.setVersion((isNaN(parseInt(db.version, 10)) ? 0 : parseInt(db.version, 10) + 1));
				req.onsuccess = function(){
					var transaction = req.result;
					transaction.db.deleteObjectStore("TempBookList");
					console.info(transaction.db);
				};
				req.onerror = function(e){
					console.error(e, req);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Transaction": {
		"code": function(){
			var transaction = $.indexedDB("BookShop1").transaction(["OldBookList", "BookList"], $.indexedDB.IDBTransaction.READ_WRITE);
			transaction.then(console.info, console.error);
			transaction.progress(function(t){
				t.objectStore("BookList").add(data()).then(console.info, console.error);
				t.objectStore("OldBookList").add(data(), new Date().getTime()).then(console.info, console.error);
			});
		},
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var transaction = db.transaction([], IDBTransaction.READ_WRITE);
				console.info(transaction);
				var bookList = transaction.objectStore("BookList");
				var oldBookList = transaction.objectStore("OldBookList");
				var req1 = bookList.add(data());
				var req2 = oldBookList.add(data(), new Date().getTime());
				req1.onsuccess = function(){
					console.info(req1.result);
				};
				req1.onerror = function(e){
					console.error(e, req1);
				};
				req2.onsuccess = function(){
					console.info(req2.result);
				};
				req2.onerror = function(e){
					console.error(e, req2);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Open Object Store, but dont create if does not exist": {
		"code": function(){
			$.indexedDB("BookShop1").objectStore("BookList", false);
		},
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				try {
					var transaction = db.transaction([], IDBTransaction.READ_WRITE);
					var objectStore = transaction.objectStore("BookList");
					console.info(objectStore);
				} catch (e) {
					console.error(e, request);
				}
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Open Object Store, or create if does not exist": {
		"code": function(){
			$.indexedDB("BookShop1").objectStore("BookList", {
				"keyPath": "id",
				"autoIncrement": true
			});
		},
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				try {
					var transaction = db.transaction([], IDBTransaction.READ_WRITE);
					var objectStore = transaction.objectStore("BookList");
					console.info(objectStore);
				} catch (e) {
					var req = db.setVersion((isNaN(parseInt(db.version, 10)) ? 0 : parseInt(db.version, 10) + 1));
					req.onsuccess = function(){
						var transaction = req.result;
						var objectStore = transaction.db.createObjectStore("BookList", {
							"autoIncrement": true
						});
						console.info(objectStore);
					};
					req.onerror = function(e){
						console.error(e, req);
					};
				}
				
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Add Data to Object Store": {
		"code": function(){
			window.book = data();
			$.indexedDB("BookShop1").objectStore("BookList", true).add(book).then(function(val){
				book.id = val;
				console.info(val);
			}, console.error);
		},
		"alternate": function(){
			window.book = data();
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var transaction = db.transaction([], IDBTransaction.READ_WRITE);
				var bookList = transaction.objectStore("BookList");
				var req = bookList.add(data());
				req.onsuccess = function(){
					book.id = req.result;
					console.info(req.result);
				};
				req.onerror = function(e){
					console.error(e, req);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Get data": {
		"code": function(){
			$.indexedDB("BookShop1").objectStore("BookList").get(book.id).then(console.info, console.error);
		},
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var transaction = db.transaction([], IDBTransaction.READ_WRITE);
				var bookList = transaction.objectStore("BookList");
				var req = bookList.get(book.id);
				req.onsuccess = function(){
					console.info(req.result);
				};
				req.onerror = function(e){
					console.error(e, req);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Modify Data in Object Store": {
		"code": function(){
			book["modified" + Math.random()] = true;
			$.indexedDB("BookShop1").objectStore("BookList").put(book, new Date().getTime()).then(console.info, console.error);
		},
		"alternate": function(){
			book["modified" + Math.random()] = true;
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var transaction = db.transaction([], IDBTransaction.READ_WRITE);
				var bookList = transaction.objectStore("BookList");
				var req = bookList.put(data(), new Date().getTime());
				req.onsuccess = function(){
					console.info(req.result);
				};
				req.onerror = function(e){
					console.error(e, req);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Cursor and list all items in the object store": {
		"code": function(){
			$.indexedDB("BookShop1").objectStore("BookList").each(console.info);
		},
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var transaction = db.transaction([], IDBTransaction.READ_WRITE);
				var bookList = transaction.objectStore("BookList");
				var req = bookList.openCursor();
				req.onsuccess = function(){
					var cursor = req.result;
					if (cursor) {
						console.info(req.result.value);
						cursor["continue"]();
					}
				};
				req.onerror = function(e){
					console.error(e, req);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Cursor and delete items with price that is an odd number": {
		"code": function(){
			$.indexedDB("BookShop1").objectStore("BookList").each(function(elem){
				if (elem.value && elem.value.price % 2) {
					console.info("Deleting", elem.value);
					elem["delete"]();
					return true;
				}
			});
		},
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var transaction = db.transaction([], IDBTransaction.READ_WRITE);
				var bookList = transaction.objectStore("BookList");
				var req = bookList.openCursor();
				req.onsuccess = function(){
					var cursor = req.result;
					if (cursor) {
						if (cursor.value && cursor.value.price % 2) {
							console.info("Deleting", cursor.value);
							cursor["delete"]();
						}
						cursor["continue"]();
					}
				};
				req.onerror = function(e){
					console.error(e, req);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Cursor and update items with price that is an even number": {
		"code": function(){
			$.indexedDB("BookShop1").objectStore("BookList").each(function(elem){
				if (elem.value && elem.value.price % 2) {
					console.info("Updating", elem.value);
					elem.value["modifiedCursor-" + Math.random()] = true;
					elem.update(elem.value);
				}
			});
		},
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var transaction = db.transaction([], IDBTransaction.READ_WRITE);
				var bookList = transaction.objectStore("BookList");
				var req = bookList.openCursor();
				req.onsuccess = function(){
					var cursor = req.result;
					if (cursor) {
						if (cursor.value && cursor.value.price % 2) {
							cursor.value["modified-" + Math.random()] = true;
							console.info("Updating", cursor.value);
							cursor.update(cursor.value);
						}
						cursor["continue"]();
					}
				};
				req.onerror = function(e){
					console.error(e, req);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	"Open an Index and iterate over its objects": {
		"code": function(){
			$.indexedDB("BookShop1").objectStore("BookList").index("price").each(console.info);
		},
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var transaction = db.transaction([], IDBTransaction.READ_WRITE);
				var bookList = transaction.objectStore("BookList");
				// Assuming that index exists
				var index = bookList.index("price-index");
				var req = index.openCursor();
				req.onsuccess = function(){
					var cursor = req.result;
					if (cursor) {
						console.info(cursor.value);
						cursor["continue"]();
					}
				};
				req.onerror = function(e){
					console.error(e, req);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	},
	
	"Open a key cursor on an Index and iterate over its objects": {
		"code": function(){
			$.indexedDB("BookShop1").objectStore("BookList").index("price").eachKey(console.info, [200, 500]);
		},
		"alternate": function(){
			var request = window.indexedDB.open("BookShop1");
			request.onsuccess = function(event){
				var db = request.result;
				var transaction = db.transaction([], IDBTransaction.READ_WRITE);
				var bookList = transaction.objectStore("BookList");
				var index = bookList.index("price-index");
				var range = new IDBKeyRange.bound(200, 500, true, true);
				var req = index.openKeyCursor(range);
				req.onsuccess = function(){
					var cursor = req.result;
					if (cursor) {
						console.info(cursor.value, cursor.key);
						cursor["continue"]();
					}
					
				};
				req.onerror = function(e){
					console.error(e, req);
				};
			};
			request.onerror = function(e){
				console.error(e, request);
			};
		}
	}
};
