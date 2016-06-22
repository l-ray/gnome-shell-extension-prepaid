const Lang = imports.lang;

const Gtk = imports.gi.Gtk;

const PARSE_NUMBER_REGEX = /(\d{0,6})\.?(\d{0,2})/;

/*
 *  Base 'abstract' class for balance provider. Every format inherits from this class
 *  and must implements all empty methods
 */
const BaseProvider = new Lang.Class({

    Name: 'BaseProvider',
    title: 'title',
    protocol: String(),
    server: String(),
    port: String(),
    theObject: String(),
    login: String(),
    link: String(),
    keystore: Object(),
    limit: Number(),
    currencySymbol: "€",

    /*
     *  Initialize the instance of BaseProvider class
     *  root - root element of feed file
     */
    _init: function(title,login,keystore,limit) {
        this.title=title;
        this.login=login;
        log("base provider keystore:"+keystore);
        this.keystore = keystore;
        this.limit = limit;
    },

    collectData: function(_httpSession, func) {
        return this.collectDataInternal(
            _httpSession,
            (extract) => {
                var extractAsCents = this.convertToCents(extract);
                var flags = {
                    'warning': extractAsCents < this.limit
                };
                func(
                    extractAsCents
                    ,flags
                );
            }
        );
    },

    /*
     *  Abstract function to Parse feed file
     */
    collectDataInternal: function() {
        // child classes implements this 'abstract' function
        throw "Not implemented by concrete class."
    },

    getUri: function() {
        return this.protocol+"://"+this.server+":"+this.port+this.theObject
    },

    getBalanceManagementLink : function() {
      if (this.link.startsWith("http")) {
          return this.link
      }  else {
          return this.protocol+"://"+this.server+":"+this.port+this.link
      }
    },

    launchBalanceManagement : function() {
            let url = this.getBalanceManagementLink();

            try {
                Gtk.show_uri(null, url, global.get_current_time());
            } catch (err) {
                let title = "Can not open %s".format(url);
                log(title+"  "+err.message);
                //Main.notifyError(title, err.message);
            }
    },

    retrievePassword: function(callback) {
        return this.keystore.retrievePassword(
            this.protocol,
            this.server,
            this.port,
            this.theObject,
            this.login,
            callback
        );
    },

    savePassword: function(password) {
        return this.keystore.savePassword(
            this.protocol,
            this.server,
            this.port,
            this.theObject,
            this.login,
            password
        );
    },

    removePassword:function(){
        this.keystore.removePassword(
            this.protocol,
            this.server,
            this.port,
            this.theObject,
            this.login
        )
    },

    destroy:function(){
        try {
            this.keystore.destroy();
        } catch(ex) {
            log('error during destroy of provider base instance.');
        }
    },

    convertToCents:function(amountString){
        var groups = PARSE_NUMBER_REGEX.exec(amountString.trim());
        var euros = Number(groups[1]);
        // differ between e.g. 0.20 and 0.2
        var cents = Number(groups[2].length == 1 ? groups[2]+"0":groups[2]);
        return euros*100+cents;
    }

});