const Lang = imports.lang;

const GnomeKeyring = imports.gi.GnomeKeyring;

const Mainloop = imports.mainloop;


/*
 *  Base 'abstract' class for RSS parser. Every format inherits from this class
 *  and must implements all empty methods
 */
const Keystore = new Lang.Class({

    Name: 'Keystore',

    initialized: false,

    idTimeout: String(),

    // keystore
    savePassword: function (protocol, server,port,object,login, password) {
        GnomeKeyring.unlock_sync(null, null);
        var id=login+"@"+server;
        log('Adding keyring entry for id ' + id);
        //GnomeKeyring.create_sync(keyringName, None)

        var attrObj = GnomeKeyring.Attribute;
        var attrs = attrObj.list_new();

        //attrObj.list_append_string(attrs, 'id', id);
        attrObj.list_append_string(attrs, 'user', login);
        attrObj.list_append_string(attrs, 'server', server);
        attrObj.list_append_string(attrs, 'protocol', protocol);
        attrObj.list_append_uint32(attrs, 'port', port);
        //attrObj.list_append_string(attrs, 'object', object);
        GnomeKeyring.item_create_sync(null, GnomeKeyring.ItemType.NETWORK_PASSWORD, id, attrs, password, true);
        log('  => Stored.')
    },

    retrievePassword:function (protocol, server, port, theObject, login, callback,dontWait = false) {
        //savePassword(instanceName, login, "test234")
        //GnomeKeyring.unlock_sync(null, null)

        var initialized = this.initialized || dontWait;

        log("generating callback for retrieving password");
        var timeoutCallback = () => {

            log('Fetch secret for id '+login+'@'+server);

            var attrObj = GnomeKeyring.Attribute;
            var attrs = attrObj.list_new();

            attrObj.list_append_string(attrs, 'user', login);
            attrObj.list_append_string(attrs, 'server', server);
            attrObj.list_append_string(attrs, 'protocol', protocol);
            attrObj.list_append_uint32(attrs, 'port', port);
            //attrObj.list_append_string(attrs, 'object', theObject);

            var [status, result] = GnomeKeyring.find_items_sync(GnomeKeyring.ItemType.NETWORK_PASSWORD, attrs);

            log('Result:'+status+' and '+result+' with '+ result[0] +' and '+result.length+' keyring result ok is '+GnomeKeyring.Result.OK);

            if (status != GnomeKeyring.Result.OK) return;

            log('  => password '+result[0].secret);
            log('     keyring id  = '+result[0].item_id);
            log('     keyring  = '+result[0].keyring);

            initialized = true;

            if (result[0] != undefined) {
                callback(result[0].secret, result[0].item_id, result[0].keyring)
            }

        }

        if (!initialized && !dontWait) {
            this.idTimeout = Mainloop.timeout_add(20000, function () {
                timeoutCallback ();
                return false; // Stop repeating
            }, null);
        } else {
            timeoutCallback();
        }
    },

    // keystore
    removePassword: function (protocol, server,port,object,login) {
        this.retrievePassword(protocol, server, port, object,login,function(pw, itemId, keyring){
            GnomeKeyring.item_delete_sync(keyring, itemId);
        },true);
    }
});