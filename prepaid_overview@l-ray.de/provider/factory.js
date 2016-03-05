const Me = imports.misc.extensionUtils.getCurrentExtension();
const Sipgate = Me.imports.provider.sipgate;
const TMI = Me.imports.provider.tmi;

const GnomeKeyring = imports.gi.GnomeKeyring;

const Mainloop = imports.mainloop;

/*
 *  Factory function that initialize correct parser class instance
 */
function getInstance(credential) {

    var cDto = unserializeCredentialString(credential)
    try {
 
	log("searching type: |"+cDto.instanceName+"|")

	if (cDto.instanceName == "SIPGATE") {
		return new Sipgate.SipgateProvider(cDto.login, cDto.password, cDto.label);	
	}

	if (cDto.instanceName == "TESCO_MOBILE_IE") {
		return new TMI.TMIProvider(cDto.login, cDto.password, cDto.label);	
	}

   }
    catch (e) {
        log("Exception occured:"+e);
    }

    return null;
}

    function unserializeCredentialString(credential){
	log("got credential "+credential);	
	var credRegex = /^"(.*?)"<(.*?):(.*?)@@(.*?)>$/g;
	var credArray = credRegex.exec(credential)
	log("got credential-array "+credArray);
	return {
		label: credArray[1],
		login: credArray[2],
		password: credArray[3],
		instanceName: credArray[4]	
	}
    
    }

    function serializeCredentialString(c){
	return "\""+c.label+"\"<"+c.login+":"+c.password+"@@"+c.instanceName+">"
    }

function savePassword(instanceName,login, password) {
    GnomeKeyring.unlock_sync(null, null)
    var id=login+"@"+instanceName;
    log('Adding keyring entry for id ' + id)
    //GnomeKeyring.create_sync(keyringName, None)
    var attrs = GnomeKeyring.Attribute.list_new()
    GnomeKeyring.Attribute.list_append_string(attrs, 'id', id)
    GnomeKeyring.item_create_sync(null, GnomeKeyring.ItemType.GENERIC_SECRET, id, attrs, password, true)
    log('  => Stored.')
	
}

// time out
function setTimeout(func, millis) {

    let id = Mainloop.timeout_add(millis, function () {
        func();
        return false; // Stop repeating
    }, null);

    return id;
};


function retrievePassword(instanceName,login) {
    //savePassword(instanceName, login, "test234")
    //GnomeKeyring.unlock_sync(null, null)

    this.idTimeout = setTimeout(() => {

      var id=login+"@"+instanceName;
      log('Fetch secret for id '+id)
      var attrs = GnomeKeyring.Attribute.list_new()
      GnomeKeyring.Attribute.list_append_string(attrs, 'id', id)
      var result = GnomeKeyring.find_items_sync(GnomeKeyring.ItemType.GENERIC_SECRET, attrs)
      log('Result:'+result[0]+' and '+result[1]+'with'+ result[1][0] +' and '+result[1].length+'keyring result ok is '+GnomeKeyring.Result.OK)
      if (result[0] != GnomeKeyring.Result.OK) return

      log('  => password '+result[1][0].secret)
      log('     keyring id  = '+result[1][0].item_id)
      log('     keyring  = '+result[1][0].keyring)

    }, 20000);
}
