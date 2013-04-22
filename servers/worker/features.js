var router = local.http.ext.router;
var responder = local.http.ext.responder;
var config = local.worker.config;

// live update list
var theList = [
	'bounded', 'civic', 'confined', 'district', 'divisional', 'geographical', 'insular', 'legendary',
	'limited', 'narrow', 'neighborhood', 'parish', 'parochial', 'provincial', 'regional', 'sectarian',
	'sectional', 'small-town', 'territorial', 'town', 'vernacular'
];
var theListFilter = '';
var listBroadcaster = local.http.ext.broadcaster();

// local storage nav
var localStorageCollection = local.http.ext.navigator('httpl://localstorage.env').collection('features-test');

function main(request, response) {
	var respond = responder(response);
	router(request)
		.mp(/GET/i, '/list', function() {
			router.a(/event\-stream/, function() {
				// add stream to our broadcast
				respond.ok('text/event-stream');
				listBroadcaster.addStream(response);
			});
			router.a(/html/, function() {
				// send back list html
				respond.ok('html').end(makeList(request));
			});
			router.error(response, ['method','path']);
		})
		.mp(/PATCH/i, '/list', function() {
			// update the filter and trigger a GET
			theListFilter = request.body.filter;
			listBroadcaster.emit('update');
			respond.noContent().end();
		})
		.mp(/GET|POST/i, '/env', function() {
			var p = local.promise(true);
			// pass post on to local storage
			if (/POST/i.test(request.method)) {
				if (request.body['delete']) { // delete button?
					// delete the entry
					var targetId = request.body['delete'];
					p = localStorageCollection.item(targetId).delete();
				} else {
					// add a new entry
					p = localStorageCollection.post({});
				}
			}
			// get data and send back interface html
			p.succeed(function(res) {
				return localStorageCollection.getJson();
			}).succeed(function(res) {
				respond.ok('html').end(makeDoc('env', request, res.body));
			}).fail(respond.cb('badGateway'));
		})
		.mp(/GET|POST/i, RegExp('^/([a-z\\-]*)/?$'), function(match) {
			// send back interface html
			respond.ok('html').end(makeDoc(match.path[1], request));
		})
		.error(response);
}

// html builders
function makeNavLi(a, b, label) {
	return [
		(a == b) ? '<li class="active">' : '<li>',
		'<a href="httpl://'+config.domain, '/', b, '">', label, '</a></li>'
	].join('');
}

function makeNav(tab) {
	tab = tab || 'httpl';
	return [
		'<ul class="nav nav-pills">',
			makeNavLi(tab,'httpl','HTTPL'),
			makeNavLi(tab,'app','Applications'),
			makeNavLi(tab,'env','The Page'),
			makeNavLi(tab,'more','Learn More'),
		'</ul>'
	].join('');
}

function makeFormItem(label, controls) {
	return [
		'<div class="control-group">',
			'<label class="control-label">',label,'</label>',
			'<div class="controls">', controls, '</div>',
		'</div>'
	].join('');
}

function makeDoc(tab, request, content) {
	var html;
	var body = request.body || {};
	var isPost = /post/i.test(request.method);
	switch (tab) {
		case 'httpl':
		default:
			html = [
				'<p>Applications running in Web Workers respond to HTTPL requests from the page:</p>',
				'<form action="httpl://', config.domain, '/httpl" method="post" class="form-horizontal">',
					'<legend>',
						'Local ',
						isPost ? 'Response <small>from ' : 'Form <small>targets ',
						'httpl://', config.domain, '</small>',
					'</legend>',
					makeFormItem('Text input', isPost ? body.input : '<input type="text" name="input" class="input-xlarge">'),
					makeFormItem('Select', isPost ? body.select : [
						'<select name="select" class="input-xlarge">',
							'<option value="A">A</option>',
							'<option value="A">B</option>',
						'</select>'
					].join('')),
					makeFormItem('Checkboxes', (isPost) ? (body.checks || []).join(', ') : [
						'<label class="checkbox inline"><input type="checkbox" name="checks" value="1"> 1</label>',
						'<label class="checkbox inline"><input type="checkbox" name="checks" value="2"> 2</label>',
						'<label class="checkbox inline"><input type="checkbox" name="checks" value="3"> 3</label>'
					].join('')),
					makeFormItem('Radios', isPost ? body.radios : [
						'<label class="radio inline"><input type="radio" value="1" checked="checked" name="radios"> 1</label>',
						'<label class="radio inline"><input type="radio" value="2" name="radios"> 2</label>',
						'<label class="radio inline"><input type="radio" value="3" name="radios"> 3</label>'
					].join('')),
					makeFormItem('Textarea', isPost ? body.textarea : '<div class="textarea"><textarea name="textarea"></textarea></div>'),
					makeFormItem('', isPost ?
						'<a class="btn" href="httpl://'+config.domain+'/httpl">Reset</a>' :
						'<input type="submit" class="btn" />'
					),
				'</form>'
			].join('');
			break;
		case 'app':
			html = [
				'<p>Server-Sent Events and added HTML behaviors allow applications to update the page in real-time:</p>',
				'<legend>Realtime Updates</legend>',
				'<form action="httpl://', config.domain, '/list" onkeyup="patch">',
					'<input type="text" name="filter" placeholder="Filter..." value="', request.query.filter ,'" /><br/>',
					'<div data-subscribe="httpl://', config.domain, '/list">', makeList() ,'</div>',
				'</form>'
			].join('');
			break;
		case 'env':
			html = [
				'<p>The Environment API controls applications and mediates traffic for security. ',
				'The page can also host servers in its namespace, so applications can access tools like localStorage:</p>',
				'<form action="httpl://', config.domain, '/env" method="post" class="form-horizontal">',
					'<legend>LocalStorage Collections</legend>',
					content.map(function(item) {
						return makeFormItem('Entry:', item.id + ' <button class="btn btn-mini btn-danger" name="delete" value="'+item.id+'"/>delete</button>');
					}).join(''),
					makeFormItem('', '<input type="submit" class="btn" value="Add Entry" />'),
				'</form>',
				'<blockquote><small>Refresh the page to see the persistence in the browser\'s localStorage</small></blockquote>'
			].join('');
			break;
		case 'more':
			html = [
				'<p>Learn more through the documentation and examples.</p>',
				'<legend>Links</legend>',
				'<ul>',
					'<li><a target=_top href=docs.html title="Documentation">Documentation</a></li>',
					'<li><a target=_top href=//blog.grimwire.com title="Development Blog">Development Blog</a></li>',
					'<li><a target=_top href=//github.com/grimwire/local title="Github Repository">Github Repository</a></li>',
					'<li><a target=_top href=//github.com/grimwire/local/issues title="Issue Tracker">Issue Tracker</a></li>',
				'</ul>'
			].join('');
			break;
	}
	return [
		makeNav(tab),
		html
	].join('');
}

function makeList(request) {
	return [
		'<ul class="unstyled">',
		theList
			.filter(function(item) {
				return !theListFilter || item.indexOf(theListFilter) != -1;
			})
			.map(function(item) {
				return '<li>'+item+'</li>';
			})
			.join(''),
		'</ul>'
	].join('');
}