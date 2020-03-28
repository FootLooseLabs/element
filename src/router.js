

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

	window.onpopstate = function(e){
		console.log(e);
		var _route_name = window.location.search.split("?").pop().split("/").slice(-1)[0] || _this.getDefaultRoute().name;
		var route_obj = _this.getRoute(_route_name);
		_this.triggerCustomEvent(window,'stateChange',{state: route_obj});
	}


	window.addEventListener('stateChange', function(ev){
		_this.onStateChange.call(_this, ev);
	});

	document.addEventListener('DOMContentLoaded', (e) => {
		var _route = window.location.search.split("?").pop().split("/").slice(-1)[0] || _this.getDefaultRoute().name;
		console.log("imp:","going to defaultRoute = ", _route);
		setTimeout(()=>{_this.go(_route)},1000);
	},false);

	console.log('router initialized');
}

Router.prototype.onInit = function(){
	var _this = this;
	// [].slice.call(_this.containment.querySelectorAll('[route]')).forEach(function(el){
 //      _this.routes.push({el.dataset.route, el.onload})
 //    })
}


Router.prototype.getDefaultRoute = function(){
	return this.routes.filter(function(route){
		return route.defaultRoute === true;
	})[0] || {};
}

Router.prototype.getRoute = function(route_name){
	return this.routes.filter(function(route){
		return route.name == route_name;
	})[0]
}

Router.prototype.closeRoute = function(route, route_el){
	var _this = this;
	if(!route){return;}
	route.onbeforeexit ? route.onbeforeexit.call(_this, route_el) : null;
	route_el.classList.remove(_this.toggleClass);
	route.active = false;	
}

Router.prototype.togglePage = function(target_page, target_route){
	var _this = this;
	var scope = this.containment;

	if(_this.isSubRoute(target_route.name)){
		var ancesstor_elems = this.getSubRouteAncesstors(target_route.name).elems;
		scope = ancesstor_elems.slice(-1)[0]; //direct parent
	}

	var currently_active_pages_in_scope = scope.querySelectorAll('._active[route]');

	currently_active_pages_in_scope.forEach(function(currently_active_page, currently_active_route){
		var currently_active_route = _this.getRoute(currently_active_page.getAttribute('route'));
		_this.closeRoute(currently_active_route, currently_active_page);
	});

	target_page.classList.add(_this.getToggleClass());
}

Router.prototype.onStateChange = function(ev){
	var _this = this;
	// var e = e.detail ? e.detail.srcEvent : e;
	// eee = ev;
	var state = ev.detail.state || {name: _this.getDefaultRoute().name};
	console.log('state changing to - ', state.name);
 
	var target_route = _this.getRoute(state.name);
	if(!target_route){
		console.log('no such route');
		return;
	}

	console.log("target_route = ", target_route);
	
	var target_page = this.containment.querySelector('[route='+state.name+']');
	if(!target_page){return;}

	this.togglePage(target_page, target_route);

	target_route.active = true;
	this._onload(target_route, target_page);

	this.active_route = target_route.name;
	console.log('state changed to - ', this.active_route);
}


Router.prototype._onload = function(target_route, target_page){
	window.scrollTo(0,0);
	if(target_route.onload){
		target_route.onload.call(this, target_page);
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


Router.prototype.updateUrl = function(route){
	var _this = this;

	var route_name = route.name;

	if(this.isSubRoute(route_name)){
		var ancesstor_routes = this.getSubRouteAncesstors(route_name).routes;
		route_name = "/" + ancesstor_routes.join("/") + "/" + route_name;
		console.log("route.name == ", route_name);
	}

	// if(_this.isSubRoute(route_name)){ //doesn't work in case of mutliple sub-routes at the same level
	// 	route_name = window.location.search.substr(1) + "/" + route.name;
	// }

	// if(route_name == "busy-loader"){
	// 	route_name+= &
	// }
	// route_name = route.name =="busy-loader" ? route_name + '&' + route.name : route_name;

	if(route.params){
		for(var key in route.params){
			route_name += ( "/" + String(key) + "=" + String(route.params[key]) );
		}
	}

	window.history.pushState({ name: route.name }, route.name, "?" + route_name);
	// window.history.pushState({ name: route_name }, route_name, "/" + route_name);
}

Router.prototype.back = function(){
	window.history.back();
}


Router.prototype.isSubRoute = function(route_name){
	var _route_el = this.containment.querySelector('[route='+route_name+']');
	if(!_route_el){return false;}
	return _route_el.hasAttribute('sub-route') ? true : false;
}

Router.prototype.getToggleClass = function(route_name){
	var _this = this;
	var _route_el = this.containment.querySelector('[route='+route_name+']');
	if(!_route_el){return _this.toggleClass}
	return _route_el.hasAttribute('route-class') ? _route_el.getAttribute('route-class') : _this.toggleClass;
}

Router.prototype.getSubRouteAncesstors = function(route_name){
	var ancesstor_elems = [].slice.call($("[route]").has(" [route='"+route_name+"'][sub-route]"));
	var ancesstor_routes = ancesstor_elems.map(function(a){return a.getAttribute("route")})
	return {elems: ancesstor_elems, routes: ancesstor_routes};
}

Router.prototype.go = function(route_name, url_params){
	var route = this.getRoute(route_name);
	var _route_el = this.containment.querySelector('[route='+route_name+']');

	if(!route){

		if(!_route_el){return;}

		var route = {name: route_name};
		
		this.addRoute(route);
	}

	var route_obj = {
		name: route.name, 
		params: url_params
	}

	this.updateUrl(route_obj);

	console.log("imp:","changing route to - ", route_obj.name);

	this.triggerCustomEvent(window,'stateChange',{ state: route_obj } );
}

Router.prototype.addRoute = function(routeObj){
	if(!routeObj){return;}
	if(!routeObj.name){return;}
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