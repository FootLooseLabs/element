import { PostOffice } from "./post_office";

/**
 * The router: which route a page is on, read from and written to its address.
 *
 * The address is the one source of truth: the current route and its params are read from it (on load, on
 * Back/Forward, whenever asked), never from history.state. Where in the address the route is kept is the address
 * style, chosen by routeDelimiter:
 *
 *   "/"  path   {basePath}{name}?{params}#{hash}    /explore/coffee?tab=notes
 *   "?"  query  {page}?{name}&{params}#{hash}        /tools/agent-builder/?learn&tab=notes
 *   "#"  hash   {page}{search}#{name}&{params}       /call#start&p=1
 *
 * Params are a standard query (URLSearchParams: encoded when written, decoded when read). A route gone to starts at
 * its top (no hash); in hash style the page's path and query are kept.
 *
 * Reading is forgiving, writing is canonical: a path-style address in the form earlier versions wrote
 * (/explore&tab=notes) is read and rewritten in place (replaceState) once; in query and hash style a route name
 * written as a key with an empty value (?learn=, as URLSearchParams re-serialises ?learn) is read as the name.
 * Loading a page never adds a history entry and never rewrites an address that has no route in it (/ stays /, the
 * default route is shown).
 *
 * Routing is headless — what the router owns, and only that:
 *   the address        match(url) / href(name, params): one reading and one writing of it
 *   the route table    routes by name; a route may declare a path with named params ({ name: 'idea', path:
 *                      'explore/:slug' }): an address is matched to it, its params read from the path and the query
 *   navigation         go / back / replace, and the browser's own Back and Forward
 *   the transition     beforeLeave(guard): a navigation asked first (refused: it does not happen — Back and Forward
 *                      too, where the browser lets a page refuse one: the Navigation API, once per user activation);
 *                      onChange(listener): each route shown, with where it came from
 * What a route looks like — which element renders, a 404, a confirm dialog, animation, scrolling — is a component's.
 */
function Router(options){
	var options = options || {};

	this.routes = [];
	this.toggleClass = options.toggleClass || '_active';
	this.routeDelimiter = options.routeDelimiter || "?";
	this.basePath = _normaliseBase(options.basePath);
	this.containment = document;
	this._guards = new Set();
	this._listeners = new Set();
	this._shown = null;
	this.__init__();
}

/** "/tools/x" | "tools/x/" | undefined -> "/tools/x/" | "/" */
function _normaliseBase(basePath){
	var base = String(basePath || "/").trim();
	if(!base.startsWith("/")){ base = "/" + base; }
	if(!base.endsWith("/")){ base += "/"; }
	return base;
}

/** params given as an object or as a query string ("a=1&b=2", "?a=1") -> a plain object of strings */
function _paramsObject(params){
	if(!params){ return {}; }
	if(typeof params === "string"){
		return Object.fromEntries(new URLSearchParams(params.replace(/^[?&#]/, "")));
	}
	var out = {};
	for(var key in params){
		if(params[key] !== undefined && params[key] !== null){ out[key] = params[key]; }
	}
	return out;
}

function _queryString(params){
	var search = new URLSearchParams();
	for(var key in params){ search.append(key, String(params[key])); }
	return search.toString();
}

/** "learn&tab=notes" | "learn=&tab=notes" | "tab=notes" -> { name, params } (query and hash style) */
function _splitNamed(text){
	var parts = text ? text.split("&") : [];
	var name = "";
	if(parts.length){
		var first = parts[0];
		var eq = first.indexOf("=");
		if(eq === -1){ name = first; parts.shift(); }
		else if(eq === first.length - 1){ name = first.slice(0, -1); parts.shift(); }
	}
	return { name: _decodeName(name), params: _paramsObject(parts.join("&")) };
}

/** A declared path ('explore/:slug', 'files/*') -> { regex, keys }: :name is one segment, * the rest of the path. */
function _compilePath(path){
	var keys = [];
	var source = String(path).replace(/^\/+|\/+$/g, "").split("/").map(function(seg){
		if(seg === "*"){ keys.push("*"); return "(.*)"; }
		if(seg.charAt(0) === ":"){ keys.push(seg.slice(1)); return "([^/]+)"; }
		return seg.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
	}).join("/");
	return { regex: new RegExp("^" + source + "$"), keys: keys };
}

/** A declared path filled from params -> { path, rest } (rest: the params the path does not take); a missing one throws. */
function _fillPath(route, params){
	var rest = { ...params };
	var path = String(route.path).replace(/^\/+|\/+$/g, "").split("/").map(function(seg){
		var key = seg === "*" ? "*" : (seg.charAt(0) === ":" ? seg.slice(1) : null);
		if(key === null){ return seg; }
		if(rest[key] === undefined || rest[key] === ""){ throw new Error("Router: route '" + route.name + "' needs " + key); }
		var value = String(rest[key]);
		delete rest[key];
		return key === "*" ? value : _decodeName(encodeURIComponent(value));
	}).join("/");
	return { path: path, rest: rest };
}

/**
 * A route name is a path as decodeURI leaves it: readable, with the escapes of what would change its meaning (%2F a
 * slash inside a segment, %3F, %23 …) kept. Written into an address: everything else encoded, those escapes as they are.
 */
function _encodeName(name){
	return String(name).split(/(%[0-9A-Fa-f]{2})/).map(function(part, i){ return i % 2 ? part : encodeURI(part); }).join("");
}

function _decodeName(name){
	try{ return decodeURI(name); }catch(e){ return name; }
}

Router.prototype.__init__ = function(){
	this._initLogging();
	this._initListeners();
	this._initSocket();
	this._log('router initialized');
}

Router.prototype._initLogging = function(){
	this._logPrefix = "Router: ";
	this._logStyle = "font-size: 12px; color:green";
}

Router.prototype._log = function() {
	var argumentsArr = Array.prototype.slice.call(arguments);
	if(arguments[0]==="imp:"){
		console.log("imp:", "%c" + this._logPrefix, this._logStyle, argumentsArr.slice(1).join(" "));
	}else{
		console.debug("%c" + this._logPrefix, this._logStyle, argumentsArr.join(" "));
	}
}

Router.prototype._initSocket = function() {
	this._socket = PostOffice.addSocket(EventTarget,"element_router");
}

/**
 * Which route an address is on: { name, params, legacy }. name is "" when the address names none (the default
 * route is shown for it); legacy is true when it is in a form this router reads but no longer writes.
 */
Router.prototype.match = function(href){
	var url = new URL(href === undefined ? window.location.href : String(href), window.location.href);

	if(this.routeDelimiter === "?"){
		var inQuery = _splitNamed(url.search.slice(1));
		return this._withRoute({ name: this._resolveName(inQuery.name), params: inQuery.params, legacy: false });
	}

	if(this.routeDelimiter === "#"){
		var inHash = _splitNamed(url.hash.slice(1));
		return this._withRoute({ name: this._resolveName(inHash.name), params: inHash.params, legacy: false });
	}

	// path style: below basePath (the base itself, with or without its closing slash, names no route)
	var path = url.pathname;
	var rest = path.startsWith(this.basePath) ? path.slice(this.basePath.length)
		: (path + "/" === this.basePath ? "" : path.replace(/^\//, ""));
	var params = {};
	var legacy = false;
	var amp = rest.indexOf("&");
	if(amp !== -1){ // /explore&tab=notes, as earlier versions wrote it
		params = _paramsObject(rest.slice(amp + 1));
		rest = rest.slice(0, amp);
		legacy = true;
	}
	params = { ...params, ..._paramsObject(url.search) };
	return this._withRoute({ name: this._resolveName(_decodeName(rest)), params: params, legacy: legacy });
}

/**
 * The declared route an address's path is ({ name, route, params }): the route of that name, or the first whose path
 * matches it — its params read from the path, over the query's. A path no route declares is a route of its own name.
 */
Router.prototype._withRoute = function(at){
	at.route = at.name;
	var own = at.name ? this.getRoute(at.name) : null;
	if(!at.name || (own && !own._made)){ return at; }
	for(var i = 0; i < this.routes.length; i++){
		var r = this.routes[i];
		if(!r._compiled){ continue; }
		var m = r._compiled.regex.exec(at.name);
		if(!m){ continue; }
		var fromPath = {};
		r._compiled.keys.forEach(function(key, k){ fromPath[key] = key === "*" ? m[k + 1] : _decodeName(decodeURIComponent(m[k + 1])); });
		at.route = r.name;
		at.params = { ...at.params, ...fromPath };
		return at;
	}
	return at;
}

/** A declared route with a path, gone to by its name: the address it is at, and the params left for the query. */
Router.prototype._addressOf = function(route_name, url_params){
	var declared = this.getRoute(route_name);
	var params = _paramsObject(url_params);
	if(!declared || !declared.path){ return { name: route_name, params: params }; }
	var filled = _fillPath(declared, params);
	return { name: filled.path, params: filled.rest };
}

/**
 * A route written with its ancestors' names (a sub-route: parent/child) is read back as the route it is, when the
 * whole path is no route of its own.
 */
Router.prototype._resolveName = function(name){
	if(!name || this.getRoute(name) || name.indexOf("/") === -1){ return name; }
	var last = name.split("/").pop();
	return (last && this.getRoute(last) && this.getRouteEl(last)) ? last : name;
}

/** The address of a route with these params, in this router's style: what go() writes, for links. */
Router.prototype.href = function(route_name, url_params){
	var to = this._addressOf(route_name, url_params);
	return this._hrefOf(this._pathOf(this.getRoute(to.name) || { name: to.name }), to.params);
}

Router.prototype._pathOf = function(routeObj){
	if(this.isSubRoute(routeObj)){
		return this.getRouteAncesstors(routeObj.name).routes.concat(routeObj.name).join("/");
	}
	return routeObj.name;
}

/** keepHash: the address is rewritten in place (the hash stays); a route gone to starts at its top */
Router.prototype._hrefOf = function(path, params, keepHash){
	var query = _queryString(params);
	var name = _encodeName(path);
	var here = window.location;
	var hash = keepHash ? here.hash : "";
	if(this.routeDelimiter === "?"){
		return here.pathname + "?" + name + (query ? "&" + query : "") + hash;
	}
	if(this.routeDelimiter === "#"){
		return here.pathname + here.search + "#" + name + (query ? "&" + query : "");
	}
	return this.basePath + name + (query ? "?" + query : "") + hash;
}

Router.prototype.getCurrentRouteParams = function(){
	return this.match().params;
}

Router.prototype.getCurrentRouteName = function(){
	return this.match().name || this.getDefaultRoute().name;
}

Router.prototype._initListeners = function(){
	var _this = this;
	// Back / Forward: the address is already the new one
	window.addEventListener('popstate', function(){
		_this._log("imp:", "popstate");
		_this.triggerCustomEvent(window,'stateChange',{state: _this._routeAt(_this.match())});
	});

	window.addEventListener('stateChange', function(ev){
		_this.onStateChange.call(_this, ev);
	});

	document.addEventListener('DOMContentLoaded', function(){ _this.start(); }, false);

	// Back / Forward asked first, where the browser lets a page refuse one (the Navigation API: a same-document
	// traversal, once per user activation — a person can always leave by pressing again)
	if(window.navigation && typeof window.navigation.addEventListener === "function"){
		window.navigation.addEventListener("navigate", function(e){ _this._onTraverse(e); });
	}
	// leaving the page (close, reload, another site): the browser's own prompt, when a guard says something is pending
	window.addEventListener("beforeunload", function(e){
		var pending = Array.from(_this._guards).some(function(g){ return typeof g.pending === "function" && g.pending(); });
		if(pending){ e.preventDefault(); e.returnValue = ""; }
	});
}

/**
 * Ask before leaving: guard = { ask({ from, to }) -> boolean | Promise<boolean>, pending?() -> boolean }. ask is
 * asked before a navigation (go, Back, Forward): false keeps the page where it is. pending says something would be
 * lost by leaving the page itself (close, reload): the browser asks then. Returns a function that removes the guard.
 */
Router.prototype.beforeLeave = function(guard){
	var g = typeof guard === "function" ? { ask: guard } : guard;
	if(!g || typeof g.ask !== "function"){ throw new Error("Router.beforeLeave: a guard is { ask, pending? }"); }
	var _this = this;
	this._guards.add(g);
	return function(){ _this._guards.delete(g); };
}

/** Each route shown: listener({ name, route, params, from }) — from: the one before (null the first time). Returns an unsubscribe. */
Router.prototype.onChange = function(listener){
	var _this = this;
	this._listeners.add(listener);
	return function(){ _this._listeners.delete(listener); };
}

/**
 * Every guard says yes — asked in turn; one that says no, fails or throws keeps the page where it is. The answer is a
 * boolean when every guard answered at once, a Promise when one asks the person (returns a Promise).
 */
Router.prototype._mayLeave = function(to){
	var _this = this, from = this._shown, guards = Array.from(this._guards);
	var refuse = function(e){ _this._log("imp:", "a leave guard failed — staying", e && e.message); return false; };
	var askFrom = function(i){
		for(; i < guards.length; i++){
			var answer;
			try{ answer = guards[i].ask({ from: from, to: to }); }catch(e){ return refuse(e); }
			if(answer && typeof answer.then === "function"){
				var next = i + 1;
				return Promise.resolve(answer).then(function(ok){ return ok === false ? false : askFrom(next); }, refuse);
			}
			if(answer === false){ return false; }
		}
		return true;
	};
	return askFrom(0);
}

/**
 * A Back or Forward, asked first (the browser lets a page refuse one per user activation: a person can always leave
 * by pressing again). Guards that answer at once decide it there: yes, it goes on; no, it is refused. A guard that
 * asks the person: the step is refused while they answer, then — yes — taken again, to the same entry, once the
 * refused step is over (its navigateerror, then that task's end). Should the browser still refuse it, the person is
 * where they were and Back works as ever: never a loop, never a trap.
 */
Router.prototype._onTraverse = function(e){
	if(this._traversing || e.navigationType !== "traverse" || !this._guards.size || !e.cancelable){ return; }
	if(!e.destination || !e.destination.sameDocument){ return; }
	var at = this.match(e.destination.url);
	var answer = this._mayLeave({ name: at.name || this.getDefaultRoute().name, route: at.route, params: at.params });
	if(answer === true){ return; }
	var index = e.destination.index;
	var over = new Promise(function(done){
		window.navigation.addEventListener("navigateerror", function(){ setTimeout(done, 0); }, { once: true });
	});
	e.preventDefault();
	if(answer === false){ return; }
	var _this = this;
	Promise.all([answer, over]).then(function(answers){
		var target = answers[0] && window.navigation.entries()[index];
		if(!target){ return; }
		_this._traversing = true;
		var done = function(){ _this._traversing = false; };
		var going = window.navigation.traverseTo(target.key);
		going.committed.catch(function(){});
		going.finished.then(done, function(err){ _this._log("imp:", "the step back could not be taken again — staying", err && err.message); done(); });
	});
}

/** The route an address names, the address's params over the ones it was last shown with. */
Router.prototype._routeAt = function(at){
	var name = at.name || this.getDefaultRoute().name;
	if(!name){ return null; }
	var routeObj = this.getOrCreateRoute(name, at.params);
	routeObj.url = window.location.pathname + window.location.search + window.location.hash;
	return routeObj;
}

/**
 * Show the route the page was opened on. Adds no history entry; rewrites the address only when it is in a form
 * earlier versions wrote (in place), never one that names no route. Called once the page has loaded.
 */
Router.prototype.start = function(){
	var at = this.match();
	if(at.legacy){
		var routeObj = this.getOrCreateRoute(at.name || this.getDefaultRoute().name);
		var href = this._hrefOf(this._pathOf(routeObj), at.params, true);
		window.history.replaceState({ name: routeObj.name, url: href }, "", href);
	}
	this.triggerCustomEvent(window,'stateChange',{state: this._routeAt(at)});
}

Router.prototype.getDefaultRoute = function(){
	return this.routes.filter(function(route){
		return route.defaultRoute === true;
	})[0] || {};
}

Router.prototype.addDefaultRoute = function(route_name, url_params) {
	var routeObj = this.getOrCreateRoute(route_name, url_params);
	routeObj.defaultRoute = true;
}

Router.prototype.getRoute = function(route_name){
	return this.routes.filter(function(route){
		return route.name == route_name;
	})[0]
}

Router.prototype.createOrReplaceRoute = function (routeObj) {
  var idx = this.routes.findIndex((route)=>{
  	return route.name == routeObj.name;
  });
  if(idx >= 0){
  	this.routes.splice(idx,1);
  }
  this.addRoute(routeObj);
};

Router.prototype.closeRoute = function(routeObj, routeEl){
	var _this = this;
	if(!routeObj){return;}
	routeObj.onbeforeexit ? routeObj.onbeforeexit.call(_this, routeEl) : null;
	routeEl.classList.remove(_this.toggleClass);
	routeObj.active = false;	
}

// Router.prototype.togglePage = function(target_page, target_route){
// 	var _this = this;
	
// }

Router.prototype.onStateChange = function(ev){
	// var _this = this;
	// var e = e.detail ? e.detail.srcEvent : e;
	// eee = ev;
	var state = ev.detail.state || this.getDefaultRoute();
 
	var routeObj = this.getRoute(state.name);
	if(!routeObj){
		this._log('no such route');
		return;
	}

	this._onBeforeLoad(routeObj);

	this.toggleRouteEl(routeObj);

	var at = this._withRoute({ name: routeObj.name, params: { ...(routeObj.params || {}) } });
	var shown = { name: routeObj.name, route: at.route, params: at.params };
	var change = { ...shown, from: this._shown };
	this._shown = shown;
	this._listeners.forEach(function(listener){
		try{ listener(change); }catch(e){ console.error("Router: a change listener failed —", e); }
	});
}


Router.prototype.getRouteEl = function(routeName){
	return this.containment.querySelector(`[route='${routeName}']`);
}


Router.prototype.getCurrentScope = function(routeObj) {
	var scope = this.containment;

	if(this.isSubRoute(routeObj)){
		var ancesstorRouteElems = this.getRouteAncesstors(routeObj.name).elems;
		scope = ancesstorRouteElems.slice(-1)[0]; //direct parent
	}

	routeObj.scope = scope;
	return scope;
}

Router.prototype._getActiveRouteElemsInScope = function(scope) {
	var scope = scope || this.containment;
	return scope.querySelectorAll(`.${this.getToggleClass()}[route]`);
}

Router.prototype._closeAllActiveRoutesInScope = function(scope) {
	var _this = this;

	var currently_active_route_elems_in_scope = this._getActiveRouteElemsInScope(scope);

	currently_active_route_elems_in_scope.forEach(function(currently_active_route_el, currently_active_route){
		var currently_active_route_obj = _this.getRoute(currently_active_route_el.getAttribute('route'));
		_this.closeRoute(currently_active_route_obj, currently_active_route_el);
	});
}

/** The route about to be shown, told on the router's socket (and the route's own, when it names one). */
Router.prototype._onBeforeLoad = function(routeObj){
	var at = this._withRoute({ name: routeObj.name, params: { ...(routeObj.params || {}) } });
	var message = { name: routeObj.name, route: at.route, url: routeObj.url, params: at.params, active: routeObj.active };

	if(routeObj.socketName && PostOffice.sockets[routeObj.socketName]){
		PostOffice.sockets[routeObj.socketName].dispatchMessage("onBeforeLoad", message);
	}
	this._socket.dispatchMessage("onBeforeLoad", message);

	if(routeObj.onBeforeLoad){
		routeObj.onBeforeLoad.call(this, routeObj);
	}
}

Router.prototype.toggleRouteEl = function(routeObj){
	var routeEl = this.getRouteEl(routeObj.name);
	if(!routeEl){this._log('imp:','no elements with this route attr found');return;}

	var _this = this;

	var scope = this.getCurrentScope(routeObj);	

	this._closeAllActiveRoutesInScope(scope);


	//activate all the ancesstor routes to this route --> 
	var ancesstorRouteElems = this.getRouteAncesstors(routeObj.name).elems;
	ancesstorRouteElems.forEach((_routeEl)=>{
		var _parentScope = _this.getCurrentScope(_this.getOrCreateRoute(_routeEl.getAttribute("route")));
		_this._closeAllActiveRoutesInScope(_parentScope);
		_routeEl.classList.add(this.getToggleClass());
	});

	routeEl.classList.add(this.getToggleClass());
	routeObj.active = true;
	this._onload(routeObj, routeEl);

	this.active_route = routeObj.name;
	this._log('imp:','toggled element with route attr = ', this.active_route);
}


Router.prototype._onload = function(target_route, target_page){
	window.scrollTo(0,0);
	if(target_route.onload){
		target_route.onload.call(this, target_page, target_route);
	}
	if(this.onroutechange){
		this.onroutechange(target_route, target_page);
	}
}

Router.prototype.triggerCustomEvent = function(target, eventName, details){
  if(!target){return;}
  if(!eventName){return;}
  var evnt = new CustomEvent(eventName, {
      detail: details
    });
  target.dispatchEvent(evnt);
}


/**
 * Write the route into the address: a new history entry, or the current one when the address would not change or
 * when replacing (a redirect stands in for the address it leaves).
 */
Router.prototype.updateState = function(routeObj, options){
	var href = this._hrefOf(this._pathOf(routeObj), routeObj.params || {});
	routeObj.url = href;
	var data = { name: routeObj.name, url: href };
	var here = window.location.pathname + window.location.search + window.location.hash;
	try{
		if(href === here || (options && options.replace)){ window.history.replaceState(data, "", href); }
		else{ window.history.pushState(data, "", href); }
	}catch(e){
		this._log("imp:", "ERROR updating History", e && e.message);
	}
}

Router.prototype.back = function(){
	window.history.back();
}


Router.prototype.isSubRoute = function(routeObj){
	var routeEl = this.getRouteEl(routeObj.name);
	if(!routeEl){return false;}
	return true;
	return routeEl.hasAttribute('sub-route') ? true : false;
}

Router.prototype.getToggleClass = function(route_name){
	var _this = this;
	var routeEl = this.getRouteEl(route_name);
	if(!routeEl){return _this.toggleClass}
	return routeEl.hasAttribute('route-class') ? routeEl.getAttribute('route-class') : _this.toggleClass;
}

Router.prototype.getRouteAncesstors = function(route_name){
	var nodeList = document.querySelectorAll("[route]")
	var ancesstorRouteElems = Array.from(nodeList).filter(el => el.querySelector("[route='"+route_name+"']"))
	// var ancesstorRouteElems = [].slice.call($("[route]").has(" [route='"+route_name+"'][sub-route]"));
	var ancesstorRoutes = ancesstorRouteElems.map(function(a){return a.getAttribute("route")})
	return {elems: ancesstorRouteElems, routes: ancesstorRoutes};
}

/**
 * Go to a route. Its params (an object, or a query string) are added to the ones it was last shown with; the
 * address is written in this router's style. { replace: true } for a redirect: the address it leaves is not kept in
 * the history, so Back does not return to it (and be sent on again).
 */
Router.prototype.go = function(route_name, url_params, options){
	var to = this._addressOf(route_name, url_params);
	var at = this._withRoute({ name: to.name, params: { ...to.params } });
	var answer = this._guards.size ? this._mayLeave({ name: to.name, route: at.route, params: at.params }) : true;
	var _this = this;
	var decide = function(ok){ if(ok){ _this._goNow(to, options); } return ok; };
	// answered at once (no guard, or none that asks the person): gone now, as go always has
	return (answer === true || answer === false) ? Promise.resolve(decide(answer)) : answer.then(decide);
}

Router.prototype._goNow = function(to, options){
	var routeObj = this.getOrCreateRoute(to.name, to.params);
	this.updateState(routeObj, options);
	this._log("imp:","changing route to - ", routeObj.name);
	this.triggerCustomEvent(window,'stateChange',{ state: routeObj } );
}

Router.prototype.getOrCreateRoute = function(route_name, url_params){
	var params = _paramsObject(url_params);
	var routeObj = this.getRoute(route_name);
	if(routeObj){
		routeObj.params = {...routeObj.params, ...params};
	}else{
		routeObj = {
			name: route_name,
			params: params,
			_made: true // made by going to it, not declared: a declared route whose path matches it still names it
		}
		this.addRoute(routeObj);
	}
	return routeObj;
}

Router.prototype.initSocket = function(socketName){
	this._log("imp:","initializing socket = ", socketName);
	PostOffice.addSocket(EventTarget, socketName);
}

Router.prototype.addRoute = function(routeObj, options){
	if(!routeObj){return;}
	if(!routeObj.name){return;}
	var options = options || {};

	if(routeObj.socketName){
		this.initSocket(routeObj.socketName);
	}
	if(routeObj.path && /[:*]/.test(routeObj.path)){
		routeObj._compiled = _compilePath(routeObj.path);
	}

	if(options.force) {
		this.createOrReplaceRoute(routeObj);
		return;
	}
	if(!this.getRoute(routeObj.name)){
		this.routes.push(routeObj);
	}
}

Router.prototype.addRouteConfig = function(routeObjList){
	var _this = this;
	routeObjList.forEach(function(routeObj){
		_this.addRoute(routeObj);
	});
}

Router.prototype.getActiveRoute = function(){
	return this.active_route ? this.getRoute(this.active_route) : null;
}


export {
	Router
}