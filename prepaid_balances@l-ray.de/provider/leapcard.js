const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Base = Me.imports.provider.base;
const Soup = imports.gi.Soup;

function extractValueForField(field, payload){

    var extRegex = new RegExp("id=\""+field+"\" value=\"(.*)\" />");
    return extRegex.exec(payload)[1]

}

function extractBalance(payload) {
    var extRegex = /<div class=\"pull-left\">([^<]*)</;
    return extRegex.exec(payload)[1]
}

const LeapCardProvider = new Lang.Class({

    Name: 'LeapCardProvider',
    Extends: Base.BaseProvider,

    /*
     *  Initialize the instance of LeapCardProvider class
     *  root - root element of feed file
     */
    _init: function(login,keystore, label) {
        this.parent(
            label,
            "https",
            "www.leapcard.ie",
            "443",
            "/en/login.aspx",
            login,
            keystore);
    },

    collectData:function(_httpSession, func) {

        var _login = this.login;
        var _uri = this.getUri();

        var cookieJar = new Soup.CookieJar();

        Soup.Session.prototype.add_feature.call(_httpSession, cookieJar);

        var callback = function (_password) {
            let message =
                Soup.form_request_new_from_hash('GET', _uri, {});

            let queueFunction = function (_httpSession, message) {
                var statusCode =message.status_code;
                var messageData=message.response_body.data;
                try {

                    if (!messageData) {
                        log("Error " + statusCode);
                        return;
                    }

                    var params = {
                        '__VIEWSTATE': extractValueForField('__VIEWSTATE',messageData),
                        '__EVENTVALIDATION': extractValueForField('__EVENTVALIDATION',messageData),
                        '__PREVIOUSPAGE': extractValueForField('__PREVIOUSPAGE',messageData),
                        '__VIEWSTATEENCRYPTED': '',
                        '__SCROLLPOSITIONY': '0',
                        '__SCROLLPOSITIONX': '0',
                        '__EVENTARGUMENT': '',
                       '__EVENTTARGET': '',
                        '_URLLocalization_Var001': 'False',
                        'AjaxScriptManager_HiddenField': '',
                        'ctl00$ContentPlaceHolder1$UserName': _login,
                        'ctl00$ContentPlaceHolder1$Password': _password,
                        'ctl00$ContentPlaceHolder1$btnlogin': 'Login'
                    };


                    let newMessage = Soup.form_request_new_from_hash('POST', _uri, params);

                    let otherQueueFunction = function (_httpSession, message) {
                        var messageData = message.response_body.data;
                        func(extractBalance(messageData));
                    };

                    _httpSession.queue_message(newMessage, Lang.bind(this, otherQueueFunction));

                } catch (e) {
                    log("Exception " + e);
                    return;
                }

                return;
            };

            log("before queue")
            _httpSession.queue_message(message, Lang.bind(this, queueFunction));

            return;
        };
        this.retrievePassword(callback)
    }

});
