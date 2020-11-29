import { PostOffice } from "./post_office";

//to include-html end

function Router(options){
	var options = options || {};

	this.routes = [];
	this.toggleClass = options.toggleClass || '_active';
	this.containment = document;
	this.__init__();
}

Router.prototype.__init__ = function(){
	var _this = this;

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
		var msg = argumentsArr.slice(1,argumentsArr.length).join(" ");
		console.log("imp:", "%c" + this._logPrefix, this._logStyle, msg);
	}else{
		console.log("%c" + this._logPrefix, this._logStyle, msg);
	}
}


Router.prototype._initSocket = function() {
	this._socket = PostOffice.addSocket(EventTarget,"element_router");
}


Router.prototype._getParamsObjFromPathString = function(pathString) {
	var paramsStrList = pathString.split("?").pop().split("&");
	paramsStrList.shift();
	return paramsStrList.map((_paramStr)=>{
	    var paramSplit = _paramStr.split("=");
	    var paramObj = {};
	    paramObj[paramSplit[0]] = paramSplit[1];
	    return paramObj
	}).reduce((accum, curr)=> {
	   return {...accum, ...curr}
	},{})
}

Router.prototype.getCurrentRouteParams = function(){
	if(window.history.state){
		return this._getParamsObjFromPathString(window.history.state.url);
	}else{ //if url is loaded by directly entering into the address bar
		return this._getParamsObjFromPathString(window.location.search);
	}
}

Router.prototype._getRouteNameFromWindowLocation = function() {
	var routePath = window.location.search.split("?").pop().split("&").shift() || this.getDefaultRoute().name;
	return routePath;
}

Router.prototype._getRouteNameFromHistoryState = function() {
	return window.history.state.name;
}

Router.prototype.getCurrentRouteName = function(){
	if(window.history.state){
		return this._getRouteNameFromHistoryState();
	}else{ //if url is loaded by directly entering into the address bar
		return this._getRouteNameFromWindowLocation();
	}
}

Router.prototype._initListeners = function(){
	var _this = this;
	window.onpopstate = function(){ //not called wgeb durectly called by script (only called on browser actions by user)
		_this._log("imp:", "onpopstate start");
		var routeName = _this.getCurrentRouteName();
		var routeObj = _this.getRoute(routeName);
		_this._log("imp:", "onpopstate end");
		_this.triggerCustomEvent(window,'stateChange',{state: routeObj});
	}

	window.addEventListener('stateChange', function(ev){
		_this.onStateChange.call(_this, ev);
	});

	document.addEventListener('DOMContentLoaded', (e) => {
		_this.go(_this.getCurrentRouteName(),_this.getCurrentRouteParams());
	},false);
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
	return this.containment.querySelector('[route='+routeName+']');
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


Router.prototype.updateState = function(routeObj){
	var _this = this;

	if(this.isSubRoute(routeObj)){
		var ancesstorRouteNames = this.getRouteAncesstors(routeObj.name).routes;
		routeObj.url = "?" + ancesstorRouteNames.concat(routeObj.name).join("/");
		_this._log("updating historyUrl for sub-route == ", routeObj.url);
	}else{
		routeObj.url = `?${routeObj.name}`;
		_this._log("updating historyUrl for route: ", routeObj.url);
	}

	if(routeObj.params){
		for(var key in routeObj.params){
			routeObj.url += ( "&" + String(key) + "=" + String(routeObj.params[key]) );
		}
	}


	var historyTitle = routeObj.name;
	var historyUrl = routeObj.url;
	var historyData = { name: historyTitle, url: historyUrl };

	_this._log("updating history State: ", JSON.stringify(historyData));

	try{
		window.history.pushState(historyData, historyTitle, historyUrl);
	}catch(e){
		_this._log("imp:", "ERROR updating History");
		return;
	}
	_this._log("imp:", "history updated");
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

Router.prototype.updateRouteObjParams = function (routeObj, url_params) {
	if(routeObj.params){
	  	routeObj.params = {...routeObj.params, ...url_params};
	}
}

Router.prototype.go = function(route_name, url_params){
	// var routeEl = this.getRouteEl(route_name);
	// if(!routeEl){
	// 	this._log("imp:","no elements with this route attr found");
	// 	return;
	// }
	var routeObj = this.getOrCreateRoute(route_name, url_params);
	this.updateRouteObjParams(routeObj, url_params);
	this.updateState(routeObj);
	this._log("imp:","changing route to - ", routeObj.name);
	this.triggerCustomEvent(window,'stateChange',{ state: routeObj } );
}

Router.prototype.getOrCreateRoute = function(route_name, url_params){
	var routeObj = this.getRoute(route_name);
	if(!routeObj){
		routeObj = {
			name: route_name,
			params: url_params
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