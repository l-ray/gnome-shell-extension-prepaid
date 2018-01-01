const Me = imports.misc.extensionUtils.getCurrentExtension();

const Lang = imports.lang;
const St = imports.gi.St;

const PopupMenu = imports.ui.popupMenu;
const PrepaidMenuItem = Me.imports.ui.baseitem;

const TransportMenuItem = new Lang.Class({
    Name: 'TransportMenuItem',
    reactive: false,
    Extends: PrepaidMenuItem.PrepaidMenuItem,
    _label: Object(),

    _init: function(concrete, _httpSession) {
        log("in concrete, calling parent");
        this.concrete = concrete;
        this._label = new St.Label({ text: "-.--", style_class: 'pp-value' });
        var _label = this._label;
        this.parent(concrete.title,function(box){
            box.add_child(_label);
            box.add_child(new St.Label({ text: concrete.currencySymbol, style_class: 'pp-unit-label'}));
        },_httpSession);
        log("back from parent");
    },

    collectData: function() {
        this.concrete.collectData(
            this._httpSession,
            (amount,flags) => {
                this._label.text = Number(amount/100).toFixed(2);
                if (flags.warning) {
                    this._box.style_class = 'pp-box-layout warning';
                    _indicator.markForWarning();
                }
            }
        );
    }
});