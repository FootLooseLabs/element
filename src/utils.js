function randomString(_length){
      var text = "";
      var _length = _length || 5;
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
      for( var i=0; i < _length; i++ ) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
  }

var triggerCustomEvent = function(target, eventName, details){
  if(!target){return;}
  if(!eventName){return;}
  var evnt = new CustomEvent(eventName, {
      detail: details
    });
  target.dispatchEvent(evnt);
}


function deepCountChildElements(element) {
  var count = 0;

  function __traverse(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        count++;
        for (var i = 0; i < node.childNodes.length; i++) {
          __traverse(node.childNodes[i]);
        }
      }
  }

  __traverse(element);
  return count;
}

function stringToHTMLFrag(strHTML) {   //output diff from stringToDocFrag: that always returns the full html page structure (with head & body)
    var temp = document.createElement('template');
    temp.innerHTML = strHTML;
    return temp.content;
}

function stringToDocFrag(html_string) {  //can be removed eventually if stringToHTMLFrag works for all cases
     var dom = null;
     if (window.DOMParser) {
        try { 
           dom = (new DOMParser()).parseFromString(html_string, "text/html"); 
        } 
        catch (e) { dom = null; }
     }
     else if (window.ActiveXObject) {
        try {
           dom = new ActiveXObject('Microsoft.XMLDOM');
           dom.async = false;
           if (!dom.loadXML(html_string)) // parse error ..

              window.alert(dom.parseError.reason);
        } 
        catch (e) { dom = null; }
     }
     else
        alert("cannot parse xml string!");
     return dom;
}



function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


function createCORSRequest(method, url, async) {
  var xhr;
  if (window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
      xhr=new XMLHttpRequest();
    }
  else
    {// code for IE6, IE5
      xhr=new ActiveXObject("Microsoft.XMLHTTP");
    }

  if ("withCredentials" in xhr) {

    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.
    xhr.open(method, url, async);

  } else if (typeof XDomainRequest != "undefined") {

    // Otherwise, check if XDomainRequest.
    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
    xhr = new XDomainRequest();
    xhr.open(method, url);

  } else {

    // Otherwise, CORS is not supported by the browser.
    xhr = null;

  }
  return xhr;
}


function send_ajax(target_url,method,success_callback,formdata,error_callback,busy_callback,async, headers, responseType){
  if(!target_url||!method||!success_callback){return;}
  if(!((method=="GET")||(method=="POST"))){return;}
  var async= async==false? false : true;
  // console.log("async="+String(async));

  var xmlhttp = createCORSRequest(method,target_url,async);

  xmlhttp.onreadystatechange=function()
    {
      if(xmlhttp.responseType!="document"){
        if (xmlhttp.readyState<4) {
            if(busy_callback!=undefined){busy_callback(true);}
          }

        if (xmlhttp.readyState==4){

          if(busy_callback!=undefined){busy_callback(false);}

          if(xmlhttp.status==200)
            {               
                var result = xmlhttp.responseText;
                success_callback(result);
            }
        else{
            var error = xmlhttp.responseText;
            error_callback(error);
          }
        }
      }
    }

    xmlhttp.onload = function(e) {
      if(xmlhttp.responseType=="document"){
        var result = e.target.response;
        success_callback(result);
      }
    }
    
    // xmlhttp.responseType = responseType || 'text';

    xmlhttp.open(method,target_url,async);

    if(headers){
      for(key in headers){
        xmlhttp.setRequestHeader(key, headers[key]);
      }
    }

    if(method=="POST"){
      if(!formdata){return;}
      var csrftoken = getCookie('csrftoken');
            xmlhttp.setRequestHeader("X-CSRFToken", csrftoken);
      xmlhttp.send(formdata);
    }

    if(method=="GET"){
      xmlhttp.send();
    }
}


export {
  randomString, 
  triggerCustomEvent,
  stringToHTMLFrag,
  stringToDocFrag,
  send_ajax,
  deepCountChildElements
}