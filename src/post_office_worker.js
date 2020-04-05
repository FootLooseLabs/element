const responseSchema = {
  "label" : null,
  "msg" : null,
  "error" : false
} 

let requestSchema = {
  "cmd" : null,
  "msg" : null,
  "label": null
}


const _logPrefix = "muffin.Worker: ";
// const _logStyle = "font-size: 12px; color:blue";
    // console.group(this._logPrefix);

self.log = function() {
  var argumentsArr = Array.prototype.slice.call(arguments);
  if(arguments[0]==="imp:"){
    var msg = argumentsArr.slice(1,argumentsArr.length).join(" ");
    console.log("imp:", _logPrefix, msg);
  }else{
    console.log(_logPrefix, msg);
  }
}


self.pong = () => {
  postMessage("pong");
}


self.onmessage = function(msgEv) {
  log('imp:','Message received from muffin.webpage');
  if(msgEv.data == "ping"){
    self.pong();
    return;
  }
  var request = {...requestSchema, ...msgEv.data}
  var response = Object.assign(responseSchema);
  response.label = request.label;

  var targetFunc = self[request.cmd];
  if(!targetFunc){
    response.error = true;
    response.msg = 'no valid command found for the given message';
    log('imp:', response.msg);
    postMessage(response);
    return;
  }

  response.msg = 'found target cmd';
  log('imp:', response.msg);

  try{
    response.msg = targetFunc(msgEv.data.msg);
  }catch(e){
    response.error = true;
    response.msg = e.toString();
    log('imp:', response.msg);
  }
  postMessage(response);
}


self.renderMarkup = function({markupFunc, data, uiVars, uid}){
  var renderedMarkup = markupFunc(data, uid, uiVars);
}