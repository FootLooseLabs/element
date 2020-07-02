// window.LOGGING_LEVEL = "NODEBUG";

let DefaultConfig = self.MUFFIN_CONFIG || {
	"LOGGING_LEVEL" : "IMP",
	"POST_OFFICE_WORKER_URL": "muffin_po_worker.js",
	"INTROSPECT": false,
    "DB_NAME": 'element_footloose_labs_db',
    "DB_VERSION": "0.1",
    "DEBUG_SCOPE": {}
};

export {
	DefaultConfig
}