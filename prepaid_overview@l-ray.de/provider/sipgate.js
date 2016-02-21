
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Base = Me.imports.provider.base;
const Soup = imports.gi.Soup;
const GLib = imports.gi.GLib;
// const Log = Me.imports.logger;


const SipgateProvider = new Lang.Class({

    Name: 'SipgateProvider',
    Extends: Base.BaseProvider,
    _login: String(),
    _password: String(), 

    /*
     *  Initialize the instance of SipgateProvider class
     *  root - root element of feed file
     */
    _init: function(login,password,label) {
        this.parent(label,"http://www.sipgate.de");
        this._login = login;
	this._password = password; 
        //Log.Debug("Sipgate provider");
    },

    collectData:function(_httpSession, func){

        let message = 
		Soup.xmlrpc_message_new ("https://api.sipgate.net/RPC2", "samurai.BalanceGet", new GLib.Variant('()',1.0))

        let auth = new Soup.AuthBasic()  

        auth.authenticate(this._login, this._password);
        message.request_headers.append("Authorization",auth.get_authorization(message))

        let queueFunction = function(_httpSession, message) {
            
	   try {
                if (!message.response_body.data) {
                    log("Error "+message.status_code)
		    //fun.call(this, 0);
                    return;
                } else {
                log("got message-status:"+message.status_code)
                }
		
		var result = message.response_body.data
                log(message.response_body.data)    
                func(
			result.substr(
				result.indexOf("TotalIncludingVat</name><value><double>")+39,
				4
			)
		);
                
            } catch (e) {
		log("Exception "+e)                
                return;
            }
          
           return;
        }

        _httpSession.connect('authenticate', Lang.bind(this,function(session,message, auth,retryFlag){
            log("retry:"+retryFlag);
	    log("Login:"+this._login+", password "+this._password)
            auth.authenticate(this._login, this._password);
            return;
         }))
	log("before queue")
        _httpSession.queue_message(message, Lang.bind(this, queueFunction));
        
        return;
    }    

});
