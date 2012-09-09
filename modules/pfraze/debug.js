var server = {
	routes:[
		HttpRouter.route('hello', { uri:'^/?$', method:'get', accept:'text/html' }),
		HttpRouter.route('subhello', { uri:'^/sub$', method:'get', accept:'text/html' })
	],
	hello:function() {
		var p = new Promise();
		Agent.dispatch({ uri:'/debug/sub', method:'get', accept:'text/html' }).then(function(response){
			p.fulfill(HttpRouter.response(200, '<h1>"'+response.body+'" from debug.js!!</h1>', 'text/html'));
		});
		return p;
	},
	subhello:function() {
		return HttpRouter.response(200, 'sub hello', 'text/html');
	}
};
//Util.logMode('routing', true);
Agent.addServer('', server);

postEventMsg('ready');