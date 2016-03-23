const Me = imports.misc.extensionUtils.getCurrentExtension();
const Sipgate = Me.imports.provider.sipgate;
const TMI = Me.imports.provider.tmi;
const LeapCard = Me.imports.provider.leapcard;


const Keystore = Me.imports.keystore.keystore;

var keystore = null;

/*
 *  Factory function that initialize correct parser class instance
 */
function getInstance(credential) {
    return getInstanceFromParam(unserializeCredentialString(credential))
}

function getInstanceFromParam(cDto) {

	if (keystore == null) {
		keystore = new Keystore.Keystore();
	}

    try {
 
	log("searching type: |"+cDto.instanceName+"| with keystore |"+keystore+"|")

	if (cDto.instanceName == "SIPGATE") {
		return new Sipgate.SipgateProvider(cDto.login, keystore, cDto.label);
	}

	if (cDto.instanceName == "TESCO_MOBILE_IE") {
		return new TMI.TMIProvider(cDto.login, keystore, cDto.label);
	}

	if (cDto.instanceName == "LEAPCARD_IE") {
		return new LeapCard.LeapCardProvider(cDto.login, keystore, cDto.label);
	}

   }
    catch (e) {
        log("Exception occured:"+e);
    }

    return null;
}

function unserializeCredentialString(credential){
	if (credential === undefined || credential.length == 0) {
		throw "Illegal Argument for credential string";
	}
	log("got credential "+credential);
	var credRegex = /^"(.*?)"<(.*?)@@(.*?)>$/g;
	var credArray = credRegex.exec(credential)
	log("got credential-array "+credArray);
	return {
		label: credArray[1],
		login: credArray[2],
		instanceName: credArray[3]
	}
}

function serializeCredentialString(c){
	return "\""+c.label+"\"<"+c.login+"@@"+c.instanceName+">"
}
