const Me = imports.misc.extensionUtils.getCurrentExtension();
const Sipgate = Me.imports.provider.sipgate;
const TMI = Me.imports.provider.tmi;

// Keep enums in sync with GSettings schemas
const ProviderTemplate = {
    DEFAULT: -1,
    SIPGATE: 'sipgate',
    TESCO_MOBILE_IE: 'tesco-mobile-ie'
};

/*
 *  Factory function that initialize correct parser class instance
 */
function getInstance(credential) {

    var cDto = unserializeCredentialString(credential)
    try {
 
	log("searching type: |"+cDto.instanceName+"|")

	if (cDto.instanceName == ProviderTemplate.SIPGATE) {
		return new Sipgate.SipgateProvider(cDto.login, cDto.password, cDto.label);	
	}

	if (cDto.instanceName == ProviderTemplate.TESCO_MOBILE_IE) {
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
