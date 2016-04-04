const Lang = imports.lang;

const Gtk = imports.gi.Gtk;

const Main = imports.ui.main;

/*
 *  Base 'abstract' class for balance provider. Every format inherits from this class
 *  and must implements all empty methods
 */
const BaseProvider = new Lang.Class({

    Name: 'BaseProvider',
    title: 'title',
    httpLink: 'http://test.de',
    protocol: String(),
    server: String(),
    port: String(),
    theObject: String(),
    login: String(),
    link: String(),
    keystore: Object(),

    /*
     *  Initialize the instance of BaseProvider class
     *  root - root element of feed file
     */
    _init: function(title,protocol,server,port,theObject,link,login,keystore) {
        this.title=title;
        this.protocol=protocol;
        this.server=server;
        this.port=port;
        this.theObject=theObject;
        this.link = link;
        this.login=login;
        log("base provider keystore:"+keystore);
        this.keystore = keystore;
    },

    /*
     *  Abstract function to Parse feed file
     */
    collectData: function(_httpSession, func) {
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
                Main.notifyError(title, err.message);
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
    }

})