interface JQueryStatic {
  indexedDB(databaseName: string, options?: JQueryIDBOptions): JQueryIDBPromise;
  indexedDB(databaseName: string, version?: number): JQueryIDBPromise;
}

interface JQueryIDBOptions {
  version?: number;
  upgrade?: (transaction: JQueryIDBTransaction) => void;
  schema?: any;
}

interface JQueryIDBPromise extends JQueryPromise {
  done(db: IDBDatabase, event: Event): void;
  progress(db: IDBDatabase, event: Event): void;
  fail(error: ErrorEvent, event: Event): void;

  cmp(key1, key2): number;
  deleteDatabase(): JQueryPromise;
  transaction(storeName: string, mode: number): JQueryPromise;
  transaction(storeNames: string[], mode: number): JQueryPromise;
  objectStore(name: string, mode?: number): JQueryIDBObjectStore;
}

interface JQueryIDBTransactionPromise extends JQueryPromise {
  progress(fn: (trans: JQueryIDBTransaction) => void);
  done(fn: (event: Event) => void);
  fail(fn: (event) => void);
}

interface JQueryIDBTransaction {
  objectStore(name: string): JQueryIDBObjectStore;
  createObjectStore(name: string, parameters?: any): JQueryIDBObjectStore;
  deleteObjectStore(): void;
  abort(): void;
}

interface JQueryIDBObjectStore {
  add(value: any, key?: any): JQueryIDBObjectStorePromise;
  get(key: any): JQueryPromise;
  put(value: any, key?: any): JQueryPromise;
  delete(key: any): JQueryPromise;
  count(): JQueryPromise;
  clear(): JQueryPromise;
  each(fn: (item: JQueryIDBItem) => void, range?: any[], direction?: any): JQueryIDBIterationPromise;
  each(fn: (item: JQueryIDBItem) => bool, range?: any[], direction?: any): JQueryIDBIterationPromise;
  each(fn: (item: JQueryIDBItem) => number, range?: any[], direction?: any): JQueryIDBIterationPromise;
  each(fn: (item: JQueryIDBItem) => any, range?: any[], direction?: any): JQueryIDBIterationPromise;
  index(indexName: string): JQueryIDBIndex;
  createIndex(property: string, options?: any, indexName?: string): JQueryIDBIndex;
  deleteIndex(indexName): void;
}

interface JQueryIDBIterationPromise extends JQueryPromise {
  done(fn: (result: any, event: Event) => void);
  fail(fn: (error, event: Event) => void);
}

interface JQueryIDBObjectStorePromise extends JQueryPromise {
  done(fn: (result: any, event: Event) => void);
  fail(fn: (error, event) => void);
}

interface JQueryIDBItem {
  key: any;
  value: any;
  delete(): void;
  update(newItem: any): void;
}

interface JQueryIDBIndex {
  each(fn: (item: JQueryIDBItem) => void, range?: any[], direction?: any): JQueryIDBIterationPromise;
  each(fn: (item: JQueryIDBItem) => bool, range?: any[], direction?: any): JQueryIDBIterationPromise;
  each(fn: (item: JQueryIDBItem) => number, range?: any[], direction?: any): JQueryIDBIterationPromise;
  each(fn: (item: JQueryIDBItem) => any, range?: any[], direction?: any): JQueryIDBIterationPromise;
  eachKey(fn: (item: JQueryIDBItem) => void, range?: any[], direction?: any): JQueryIDBIterationPromise;
  eachKey(fn: (item: JQueryIDBItem) => bool, range?: any[], direction?: any): JQueryIDBIterationPromise;
  eachKey(fn: (item: JQueryIDBItem) => number, range?: any[], direction?: any): JQueryIDBIterationPromise;
  eachKey(fn: (item: JQueryIDBItem) => any, range?: any[], direction?: any): JQueryIDBIterationPromise;
  get(key: any);
  getKey(key: any);
}