const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Base = Me.imports.provider.base;

/*
 *  'abstract' class for a phone balance provider. Every provider for amount and data rate inherits from this class
 *  and must implements all empty methods
 */
const TransportProvider = new Lang.Class({

    Name: 'PhoneProvider',
    Extends: Base.BaseProvider,


    collectData: function(_httpSession, func) {
        return this.collectDataInternal(
            _httpSession,
            (extract) => {
                var extractAsCents = this.convertToCents(extract);
                var flags = {
                    'warning': extractAsCents < this.limit
                };
                func(
                    extractAsCents,
                    flags
                );
            }
        );
    },

});