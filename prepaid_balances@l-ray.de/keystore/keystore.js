const Lang = imports.lang;

const Secret = imports.gi.Secret;

const SECRET_SCHEMA_NETWORK_COMPAT = Secret.Schema.new("org.gnome.keyring.NetworkPassword",
    Secret.SchemaFlags.NONE,
    {
        "user": Secret.SchemaAttributeType.STRING,
        "domain": Secret.SchemaAttributeType.STRING,
        "object": Secret.SchemaAttributeType.STRING,
        "protocol": Secret.SchemaAttributeType.STRING,
        "server": Secret.SchemaAttributeType.STRING,
        "authtype": Secret.SchemaAttributeType.STRING,

        "port": Secret.SchemaAttributeType.INTEGER
    }
);


/*
 *  Base 'abstract' class for RSS parser. Every format inherits from this class
 *  and must implements all empty methods
 */
const Keystore = new Lang.Class({

    Name: 'Keystore',

    // keystore
    savePassword: function (protocol, server,port,object,login, password) {

        var attributes = {
            "user": login,
            "server": server,
            "protocol":protocol,
            "port":port
            //"object":theObject
        };

        var id=login+"@"+server;

        Secret.password_store_sync(SECRET_SCHEMA_NETWORK_COMPAT, attributes, Secret.COLLECTION_DEFAULT,
            id, password, null);
        log('  => Stored.');
    },

    retrievePassword:function (protocol, server, port, theObject, login, callback) {

        //log('Fetch secret for id '+login+'@'+server);

        function internalCallback(source,result) {
            var password = Secret.password_lookup_finish(result);
            // result[0].item_id, result[0].keyring
            log('  => found password ');
            log('     source  = '+source);
            log('     result  = '+result);

            return callback(password, source, null)
        }

        Secret.password_lookup(
            SECRET_SCHEMA_NETWORK_COMPAT,
            { "user": login,
              "server": server,
              "protocol":protocol,
              "port":port//,
              //"object":theObject
            },
            null, internalCallback);

    },

    // keystore
    removePassword: function (protocol, server,port, theObject,login) {

        function on_password_clear(source, result) {
            var removed = Secret.password_clear_finish(result);
            // removed will be true if the password was removed
            log(removed?"password removed from keystore":"error removing password");
        }

        // The attributes used to lookup which password to remove should conform to the schema.
        Secret.password_clear(
            SECRET_SCHEMA_NETWORK_COMPAT,
             {
                 "user": login,
                 "server": server,
                 "protocol":protocol,
                 "port":port
                 //"object":theObject
             },
             null, on_password_clear);
    },

    destroy: function() {
            // nothing to destroy at the moment
    }
});