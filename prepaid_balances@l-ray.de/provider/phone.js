const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Base = Me.imports.provider.base;

/*
 *  'abstract' class for a phone balance provider. Every provider for amount and data rate inherits from this class
 *  and must implements all empty methods
 */
const PhoneProvider = new Lang.Class({

    Name: 'PhoneProvider',
    Extends: Base.BaseProvider,
    timeSymbol: "min",
    capacitySymbol: "MB",

    collectData: function(_httpSession, func) {
        return this.collectDataInternal(
            _httpSession,
            (amounts) => {
                var extractAsCents = this.convertToCents(amounts.money);
                var flags = {
                    'warning': extractAsCents < this.limit
                };
                func(
                    {
                        money : extractAsCents,
                        data : amounts.data,
                        time : amounts.time
                    },
                    flags
                );
            }
        );
    },

});