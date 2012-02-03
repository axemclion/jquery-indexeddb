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

var jqueryIndexedDB_Test = {
    "Set Version": {
        "code": function(){
            $.indexeddb("BookShop1").setVersion(10).then(console.info, console.error);
        },
        "alternate": function(){
            var request = window.indexedDB.open("BookShop1");
            request.onsuccess = function(event){
                var db = request.result;
                var req = db.setVersion(isNaN(parseInt(db.version, 10)) ? 0 : parseInt(db.version, 10) + 1);
                req.onsuccess = function(){
                    console.info(req.result);
                };
                req.onerror = function(e){
                    console.error(e, req);
                };
            };
        }
    },
    
    "Transaction": {
        "code": function(){
            var transaction = $.indexeddb("BookShop1").transaction([], IDBTransaction.READ_WRITE);
            transaction.then(console.info, console.error);
            transaction.objectStore("BookList").add(data()).then(console.info, console.error);
            transaction.objectStore("OldBookList").add(data(), new Date().getTime()).then(console.info, console.error);
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
    
    "Create Object Store": {
        "code": function(){
            $.indexeddb("BookShop1").createObjectStore("BookList", {
                "keyPath": "id",
                "autoIncrement": true
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
            $.indexeddb("BookShop1").deleteObjectStore("BookList", false).then(console.info, console.error);
        },
        "alternate": function(){
            var request = window.indexedDB.open("BookShop1");
            request.onsuccess = function(event){
                var db = request.result;
                var req = db.setVersion((isNaN(parseInt(db.version, 10)) ? 0 : parseInt(db.version, 10) + 1));
                req.onsuccess = function(){
                    var transaction = req.result;
                    transaction.db.deleteObjectStore("BookList");
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
    
    "Open Object Store, but dont create if does not exist": {
        "code": function(){
            $.indexeddb("BookShop1").objectStore("BookList", false).then(console.info, console.error);
        },
        "alternate": function(){
            var request = window.indexedDB.open("BookShop1");
            request.onsuccess = function(event){
                var db = request.result;
                try {
                    var transaction = db.transaction([], IDBTransaction.READ_WRITE);
                    var objectStore = transaction.objectStore("BookList");
                    console.info(objectStore);
                } 
                catch (e) {
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
            $.indexeddb("BookShop1").objectStore("BookList", {
                "keyPath": "id",
                "autoIncrement": true
            }).then(console.info, console.error);
        },
        "alternate": function(){
            var request = window.indexedDB.open("BookShop1");
            request.onsuccess = function(event){
                var db = request.result;
                try {
                    var transaction = db.transaction([], IDBTransaction.READ_WRITE);
                    var objectStore = transaction.objectStore("BookList");
                    console.info(objectStore);
                } 
                catch (e) {
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
            $.indexeddb("BookShop1").objectStore("BookList").add(book).then(function(val){
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
            $.indexeddb("BookShop1").objectStore("BookList").get(book.id).then(console.info, console.error);
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
            $.indexeddb("BookShop1").objectStore("BookList").update(book, new Date().getTime()).then(console.info, console.error);
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
            $.indexeddb("BookShop1").objectStore("BookList").openCursor().each(console.info);
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
            $.indexeddb("BookShop1").objectStore("BookList").openCursor().deleteEach(function(value, key){
                if (value && value.price % 2) {
                    console.info("Deleting", value);
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
    
    "Cursor and update items with price that is an odd number": {
        "code": function(){
            $.indexeddb("BookShop1").objectStore("BookList").openCursor().updateEach(function(value){
                if (value && value.price % 2) {
                    value["modified-" + Math.random()] = true;
                    console.info("Updating", value);
                    return value;
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
            $.indexeddb("BookShop1").objectStore("BookList").index("price").openCursor().each(console.info);
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
            $.indexeddb("BookShop1").objectStore("BookList").index("price").openKeyCursor([200, 500]).each(console.info);
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
