
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Phone = Me.imports.provider.phone;
const Soup = imports.gi.Soup;
// const Log = Me.imports.logger;

const TMIProvider = new Lang.Class({

    Name: 'TescoMobileIrelandProvider',
    Extends: Phone.PhoneProvider,

    protocol : "https",
    server : "my.tescomobile.ie",
    port : "443",
    theObject : "/tmi-selfcare-web/rest/customer/balance",
    link : "/tmi-selfcare-web/login",

    /*
     *  Initialize the instance of SipgateProvider class
     *  root - root element of feed file
     */
    _init: function(login,keystore, label, amountLimit) {
        log("TMI keystore:"+keystore);
        this.parent(
            label,
            login,
            keystore,
            amountLimit
        );
    },

    collectDataInternal:function(_httpSession, func) {

        var _login = this.login;
        var _uri = this.getUri();

        var callback = function (_password) {
            let message =
                Soup.form_request_new_from_hash('GET', _uri, {});

            let auth = new Soup.AuthBasic();

            auth.authenticate(_login, _password);
            message.request_headers.append("Authorization", auth.get_authorization(message))


            let queueFunction = function (_httpSession, message) {

                try {

                    if (!message.response_body.data) {
                        log("Error " + message.status_code);
                        //fun.call(this, 0);
                        return;
                    } else {
                        log("got message-status:" + message.status_code)
                    }

                    let jp = JSON.parse(message.response_body.data);
                    //log(message.response_body.data)
                    func({money:jp.mainBalance});

                } catch (e) {
                    log("Exception " + e);
                    return;
                }

                return;
            };

            _httpSession.connect('authenticate', Lang.bind(this, function (session, message, auth, retryFlag) {
                if (retryFlag) return;
                log("retry:" + retryFlag);
                auth.authenticate(_login, _password);
                return;
            }));
            log("before queue")
            _httpSession.queue_message(message, Lang.bind(this, queueFunction));

            return;
        };
        this.retrievePassword(callback)
    },

    convertToCents:function(amountNumber){
        return (amountNumber*100).toFixed();
    }
});
