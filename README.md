Summary
IndexedDB Jquery plugin demo - http://nparashuram.com/trialtool/index.html#example=/IndexedDB/jquery/trialtool.html

Background
The IndexedDB API is in its draft state but is already available in Firefox 4 and Chrome 12 Canary Builds. Internet Explorer also has a version of it on their HTML5 prototypes site. In my previous posts, I have also written about IndexedDB API examples using TrialTool.

Problem
I wrote a couple of "non-production" applications and noticed that I was frequently copying non-application-logic, IndexedDB-related code across applications. Should that code be a part of a library? In my opinion, the amount of boiler plate code written to perform simple tasks like persisting or fetching data is not little. 

Code
A typical operation using the IndexedDB API would involve using the request model, creating transactions, checking for existence of object store using error responses and exceptions and then finally getting to the part where the data is actually iterated over.  

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

The above code would increase if objects have to be created with version transaction, and error conditions are to be added.

Solution
The IndexedDB Jquery plugin is an attempt to reduce this boiler plate code in addition to bring back concepts like method chaining and Deferred calls.

The philosophy followed in the library is the same as the $.ajax() call that is more than just a wrapper over the XMLHTTPRequest object. 
Some Jquery goodness that I wanted while I designed the API include

    Method chaining, access to most probable next operation in a chain. For example, once an objectStore is referenced, the next operations usually are CRUD, cursors or indexes. These operations should be available in the chain. 
    APIs for most common functions. For example, most people would not want to care about transactions. They would simply like transactions to be implicit and hence, the API opens a READ_WRITE transaction. Alternatively, the user can also explicitly open transactions and use them.
    Since the IndexedDB API is an asynchronous API, use of Deferreds() for completion. This model is much more familiar than the request and request.result model exposed in IndexedDB API.
    Default error handling, taking advantage of error event propagation in IndexedDB. Error cases are not common and should not be required at every step. The promises in Deferreds() are easier to handle errors.
    Falling back on smart defaults. For example, when a user accesses an object store and it does no exist, they would probably want to create on a version change transaction. This is done in the object store call by default. However, the user can explicitly specify that the call should fail if the objectStore does not exist.

The equivalent code for the snippet above looks something like this

$.indexeddb("BookShop-1").objectStore("BookList").openCursor().each(write); 

Code and Demo
The library is currently hosted here on GitHub and the examples illustrating the API are available at http://nparashuram.com/trialtool/index.html#example=/IndexedDB/jquery/trialtool.html.

Watch out this space for more updates on my experiments with IndexedDB. 