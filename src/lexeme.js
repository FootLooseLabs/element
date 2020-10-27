import { Generator } from "./lexeme_gen";

class Lexeme {
    static name = "";

    static schema = {};

    constructor(info) {
        this.info = {...this.constructor.schema,...info};
    }


    static inflection(info) { //can be extended in child classes inheriting from this parent; *inflection function must return boolean value;
        // console.log("lexeme: default inflection");
        if(typeof info == "string"){
            return JSON.parse(info);
        }
        return info;
    }

    static inflect(info) {
        // console.log("inflecting Lexeme - ", info);
        var inflection = false;
        try{
            var inflection = this.inflection(info);
            // console.log("inflection = ", inflection);
        }catch(e){
            console.log("imp:"," Error: lexeme inflection failed - ", e);
            return;
        }
        if(!inflection){
            console.log("imp:"," INFO: lexeme inflection function returned false.");
            return;
        }

        return new this(inflection); //if inflection is not false
    }

    get() {
        return this.info;
    }

    hasKey(keyString) {
        var _this = this;
        var keyList = keyString.split(".");
        if(keyList.length == 1){
            return key in this.info;
        }

        var _info = this.info;
        var keyIdx = 0;

        var result = true;  //need to figure out a proper way for this initial value to be false (currently insecure)
        while (keyIdx < keyList.length) {
            var _keyToTest = keyList[keyIdx];
            if(_keyToTest in _info) {
                _info = _info[_keyToTest];
                i+=1;
                continue;
            }
            result = false;
            break;
        }
        return result;
    }

    hasKeys() {
        var _this = this;
        var result = true;  //need to figure out a proper way for this initial value to be false (currently insecure)
        Array.from(arguments).forEach((key)=>{
            if(!_this.hasKey(key)){valid=false};
        });
        return result;
    }

    update(info) {
        this.info = {...this.info,...info}
        return this;
    }

    getPayload() {
        return this.info;
    }

    stringify() {
      return JSON.stringify(this.info);
    }

    getValue(keyString) {
        var keyList = keyString.split(".");
        var val = this;
        for (var i = 0; i < keyList.length; i++) {
            val = val[keyList[i]];
        }
        return val;
    }


    isString(keyString){
        if(!this.hasKey(keyString)){
            return false;
        }
        if(typeof this.getValue(keyString) == "string"){
            return true;
        }
        return false;
    }

    isNumber(keyString){
        if(!this.hasKey(keyString)){
            return false;
        }
        if(typeof this.getValue(keyString) == "number"){
            return true;
        }
        return false;
    }

    isObject(keyString){
        if(!this.hasKey(keyString)){
            return false;
        }
        if(typeof this.getValue(keyString) == "objectcd"){
            return true;
        }
        return false;
    }
}

Lexeme.Generator = Generator;

export { 
    Lexeme
}