const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Phone = Me.imports.provider.phone;
const Soup = imports.gi.Soup;
const GLib = imports.gi.GLib;
// const Log = Me.imports.logger;


const SipgateProvider = new Lang.Class({

    Name: 'SipgateProvider',
    Extends: Phone.PhoneProvider,

    protocol : "https",
    server : "api.sipgate.net",
    port : "443",
    theObject : "/RPC2",
    link : "https://www.sipgate.de/basic/dashboard",


    /*
     *  Initialize the instance of SipgateProvider class
     *  root - root element of feed file
     */
    _init: function(login,keystore,label,amountLimit) {
        this.parent(
            label,
            login,
            keystore,
            amountLimit
        );
        //Log.Debug("Sipgate provider");
    },

    collectDataInternal:function(_httpSession, func){
        var _login =  this.login;
        var _uri = this.getUri();
        var _uriV2 = "https://api.sipgate.com/v2/";

        var callback = function(_password) {
            (function(_password) {
                let message =
                    Soup.xmlrpc_message_new(_uri, "samurai.BalanceGet", new GLib.Variant('()', 1.0));

                let auth = new Soup.AuthBasic();

                auth.authenticate(_login, _password);
                message.request_headers.append("Authorization", auth.get_authorization(message));

                let queueFunction = function (_httpSession, message) {

                    try {
                        if (!message.response_body.data) {
                            log("Error " + message.status_code);
                            return;
                        } else {
                            log("got message-status:" + message.status_code);
                        }

                        var result = message.response_body.data;
                        log(message.response_body.data);
                        func(
                            {
                                money: /TotalIncludingVat<\/name><value><double>([0-9]+\.[0-9]{1,2})/.exec(result)[1]
                            }
                        );

                    } catch (e) {
                        log("Exception " + e);
                        return;
                    }

                    return;
                };

                _httpSession.connect('authenticate', Lang.bind(this, function (session, message, auth, retryFlag) {
                    if (retryFlag) return;
                    log("retry:" + retryFlag);
                    //log("Login:" + _login + ", password " + _password)
                    auth.authenticate(_login, _password);
                    return;
                }));
                log("before queue");
                _httpSession.queue_message(message, Lang.bind(this, queueFunction));

                return;
            }(_password));
            (function(_password) {
                let tokenMessage =
                    Soup.form_request_new_from_hash('GET',_uriV2 + "users",{});
                let auth = new Soup.AuthBasic();

                auth.authenticate(_login, _password);
                var theAuthString = auth.get_authorization(tokenMessage);
                tokenMessage.request_headers.append("Authorization", theAuthString);
                let queueFunction = function (_httpSession, message) {
                    try {
                        if (!message.response_body.data) {
                            log("Error " + message.status_code);
                            return;
                        } else {
                            log("got message-status:" + message.status_code)
                        }

                        let jp = JSON.parse(message.response_body.data);
                        var theUserId = jp.items[0].id;
                        var theDeviceId = jp.items[0].defaultDevice;

                        let deviceMessage =
                            Soup.form_request_new_from_hash(
                                'GET',
                                _uriV2 + theUserId+"/devices/"+theDeviceId+"/contingents",
                                {}
                            );
                        deviceMessage.request_headers.append("Authorization", theAuthString);

                        let deviceFunction = function (_httpSession, message) {
                            try {
                                log(message.status_code);
                                if (message.status_code != 200) { return; }
                                log(message.response_body.data);
                                let jp = JSON.parse(message.response_body.data);
                                log(jp.contingents+" with "+jp.contingents[0].type);
                                var theDataObj = jp.contingents.filter(theObj => theObj.type === "DATA")[0];
                                var theTimeObj = jp.contingents.filter(theObj => theObj.type === "GERMANY_MINUTES")[0];
                                var theSMSObj = jp.contingents.filter(theObj => theObj.type === "SMS")[0];
                                func(
                                    {
                                        data: (theDataObj.left/1000).toString(),
                                        time: theTimeObj.left.toString(),
                                        sms: theSMSObj.left.toString()
                                    }
                                )
                            } catch(e) {
                                log(e)
                            }
                        };
                        _httpSession.queue_message(deviceMessage, Lang.bind(this, deviceFunction));
                    } catch (e) {
                        log("Exception " + e);
                        return;
                    }
                    return;
                };

                log("before queue");
                _httpSession.queue_message(tokenMessage, Lang.bind(this, queueFunction));
            }(_password));
        };
        this.retrievePassword(callback)
    }    

});