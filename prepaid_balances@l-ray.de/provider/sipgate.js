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
    _init: function(login,keystore,label) {
        this.parent(
            label,
            "https",
            "api.sipgate.net",
            "443",
            "/RPC2",
            login,
            keystore);
        this._login = login;
        //Log.Debug("Sipgate provider");
    },

    collectData:function(_httpSession, func){
        var _login =  this._login;

        var callback = function(_password) {
            let message =
                Soup.xmlrpc_message_new("https://api.sipgate.net/RPC2", "samurai.BalanceGet", new GLib.Variant('()', 1.0))

            let auth = new Soup.AuthBasic()

            auth.authenticate(_login, _password);
            message.request_headers.append("Authorization", auth.get_authorization(message))

            let queueFunction = function (_httpSession, message) {

                try {
                    if (!message.response_body.data) {
                        log("Error " + message.status_code)
                        //fun.call(this, 0);
                        return;
                    } else {
                        log("got message-status:" + message.status_code)
                    }

                    var result = message.response_body.data
                    // log(message.response_body.data)
                    func(
                        /TotalIncludingVat<\/name><value><double>([0-9]+\.[0-9]{1,2})/.exec(result)[1]
                    );

                } catch (e) {
                    log("Exception " + e)
                    return;
                }

                return;
            }

            _httpSession.connect('authenticate', Lang.bind(this, function (session, message, auth, retryFlag) {
                if (retryFlag) return;
                log("retry:" + retryFlag);
                //log("Login:" + _login + ", password " + _password)
                auth.authenticate(_login, _password);
                return;
            }));
            log("before queue")
            _httpSession.queue_message(message, Lang.bind(this, queueFunction));

            return;
        };

        this.retrievePassword(callback)
    }    

});
