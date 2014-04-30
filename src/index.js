var util = require('./util');

module.exports = {
	Request: require('./web/request.js'),
	Response: require('./web/response.js'),
	// BridgeServer: require('./web/bridge-server.js'),
	// WorkerBridgeServer: require('./web/worker-bridge-server.js'),
	UriTemplate: require('./web/uri-template.js'),

	util: util,
	schemes: require('./web/schemes.js'),
	httpHeaders: require('./web/http-headers.js'),
	contentTypes: require('./web/content-types.js'),

	// worker: require('./worker'),
};
util.mixin.call(module.exports, require('./constants.js'));
util.mixin.call(module.exports, require('./config.js'));
util.mixin.call(module.exports, require('./promises.js'));
// util.mixin.call(module.exports, require('./spawners.js'));
util.mixin.call(module.exports, require('./request-event.js'));
util.mixin.call(module.exports, require('./web/helpers.js'));
util.mixin.call(module.exports, require('./web/httpl.js'));
// util.mixin.call(module.exports, require('./web/subscribe.js'));
// util.mixin.call(module.exports, require('./web/agent.js'));

// Request sugars
function dispatch(headers) {
	var req = new module.exports.Request(headers);
	req.bufferResponse(true);
	util.nextTick(function() {
		req.end(); // send next tick
	});
	return req;
}
function makeRequestSugar(method) {
	return function(url, params) {
		return dispatch({ method: method, url: url, params: params });
	};
}
module.exports.dispatch =  dispatch;
module.exports.HEAD =      makeRequestSugar('HEAD');
module.exports.GET =       makeRequestSugar('GET');
module.exports.POST =      makeRequestSugar('POST');
module.exports.PUT =       makeRequestSugar('PUT');
module.exports.PATCH =     makeRequestSugar('PATCH');
module.exports.DELETE =    makeRequestSugar('DELETE');
module.exports.SUBSCRIBE = makeRequestSugar('SUBSCRIBE');
module.exports.NOTIFY =    makeRequestSugar('NOTIFY');

// Create globals
var global, local = module.exports;
if (typeof window != 'undefined') global = window;
else if (typeof self != 'undefined') global = self;
if (global) {
	global.local     = local;
	global.HEAD      = local.HEAD;
	global.GET       = local.GET;
	global.POST      = local.POST;
	global.PUT       = local.PUT;
	global.PATCH     = local.PATCH;
	global.DELETE    = local.DELETE;
	global.SUBSCRIBE = local.SUBSCRIBE;
	global.NOTIFY    = local.NOTIFY;
}