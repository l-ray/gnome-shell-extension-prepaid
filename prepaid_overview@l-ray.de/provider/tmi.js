
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Base = Me.imports.provider.base;
const Soup = imports.gi.Soup;
// const Log = Me.imports.logger;


const TMIProvider = new Lang.Class({

    Name: 'TescoMobileIrelandProvider',
    Extends: Base.BaseProvider,
    _login: String(),
    _password: String(), 

    /*
     *  Initialize the instance of SipgateProvider class
     *  root - root element of feed file
     */
    _init: function(login,keystore, label) {
        log("TMI keystore:"+keystore);
        this.parent(
            label,
            "https",
            "my.tescomobile.ie",
            "443",
            "/tmi-selfcare-web/rest/customer/balance",
            login,
            keystore);
        this._login = login;
        //Log.Debug("TMI provider");
    },

    collectData:function(_httpSession, func) {

        var _login = this._login;

        var callback = function (_password) {
            let message =
                Soup.form_request_new_from_hash('GET', "https://my.tescomobile.ie/tmi-selfcare-web/rest/customer/balance", {})

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

                    let jp = JSON.parse(message.response_body.data);

                    var result = message.response_body.data
                    log(message.response_body.data)
                    func(jp.mainBalance);

                } catch (e) {
                    log("Exception " + e)
                    return;
                }

                return;
            };

            _httpSession.connect('authenticate', Lang.bind(this, function (session, message, auth, retryFlag) {
                if (retryFlag) return;
                log("retry:" + retryFlag);
                log("Login:" + _login + ", password " + _password)
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
