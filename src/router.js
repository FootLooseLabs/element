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
 */
function Router(options){
	var options = options || {};

	this.routes = [];
	this.toggleClass = options.toggleClass || '_active';
	this.routeDelimiter = options.routeDelimiter || "?";
	this.basePath = _normaliseBase(options.basePath);
	this.containment = document;
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
		return { name: this._resolveName(inQuery.name), params: inQuery.params, legacy: false };
	}

	if(this.routeDelimiter === "#"){
		var inHash = _splitNamed(url.hash.slice(1));
		return { name: this._resolveName(inHash.name), params: inHash.params, legacy: false };
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
	return { name: this._resolveName(_decodeName(rest)), params: params, legacy: legacy };
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
	return this._hrefOf(this._pathOf(this.getRoute(route_name) || { name: route_name }), _paramsObject(url_params));
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
	var name = encodeURI(path);
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

Router.prototype._onBeforeLoad = function(routeObj){

	if(routeObj.socketName && PostOffice.sockets[routeObj.socketName]){
		PostOffice.sockets[routeObj.socketName].dispatchMessage("onBeforeLoad",{
			name: routeObj.name,
	        url: routeObj.url,
	        params: routeObj.params,
	        active: routeObj.active
		});
	}

	this._socket.dispatchMessage("onBeforeLoad",{
		name: routeObj.name,
        url: routeObj.url,
        params: routeObj.params,
        active: routeObj.active
    });

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
	var routeObj = this.getOrCreateRoute(route_name, url_params);
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
			params: params
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