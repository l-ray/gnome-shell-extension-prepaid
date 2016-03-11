const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();

// const Keystore = Me.imports.keystore.keystore;

const Mainloop = imports.mainloop;


/*
 *  Base 'abstract' class for RSS parser. Every format inherits from this class
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
    keystore: Object(),

    /*
     *  Initialize the instance of BaseProvider class
     *  root - root element of feed file
     */
    _init: function(title,protocol,server,port,theObject,login,keystore) {
        this.title=title;
        this.protocol=protocol;
        this.server=server;
        this.port=port;
        this.theObject=theObject;
        this.login=login;
        log("base provider keystore:"+keystore);
        this.keystore = keystore;
        //this.httpLink=link;

        // protocol, server,login, password
        // keystore.savePassword(protocol,server,port,theObject,login,"malDa");
        /*
        keystore.retrievePassword(protocol,server,port,theObject,login,function(pw){
            log("getrieved password is: "+pw)
        },true)*/
    },

    /*
     *  Abstract function to Parse feed file
     */
    collectData: function(_httpSession, func) {
        // child classes implements this 'abstract' function
    },

    retrievePassword: function(callback,dontWait) {
        return this.keystore.retrievePassword(
            this.protocol,
            this.server,
            this.port,
            this.theObject,
            this.login,
            callback,
            dontWait
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

    remove:function(){
        this.keystore.removePassword(
            this.protocol,
            this.server,
            this.port,
            this.theObject,
            this.login
        )
    }

})