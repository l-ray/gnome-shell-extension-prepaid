const Me = imports.misc.extensionUtils.getCurrentExtension();

const Phone = Me.imports.provider.phone;
const PhoneUI = Me.imports.ui.phoneitem;

const Transport = Me.imports.provider.transport;
const TransportUI = Me.imports.ui.transportitem;
// const Phone = Me.imports.ui.phoneitem;


/*
 *  Factory function that initialize correct parser class instance
 */
function getInstance(concrete, _httpSession) {
    log("returning UI instance ");
    try {
        if (concrete instanceof Phone.PhoneProvider) {
            return new PhoneUI.PhoneMenuItem(concrete, _httpSession);
        }
        if (concrete instanceof Transport.TransportProvider) {
            return new TransportUI.TransportMenuItem(concrete, _httpSession);
        }

    }
    catch (e) {
        log("Exception occured:"+e);
    }

    return null;
}