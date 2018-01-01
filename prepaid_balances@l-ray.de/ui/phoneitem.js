const Me = imports.misc.extensionUtils.getCurrentExtension();

const Lang = imports.lang;
const St = imports.gi.St;

const PopupMenu = imports.ui.popupMenu;
const PrepaidMenuItem = Me.imports.ui.baseitem;

const PhoneMenuItem = new Lang.Class({
    Name: 'PhoneMenuItem',
    reactive: false,
    Extends: PrepaidMenuItem.PrepaidMenuItem,
    _moneyAmount: Object(),

    _init: function(concrete, _httpSession) {
        log("in concrete, calling parent");
        this.concrete = concrete;
        this._moneyAmount = new St.Label({ text: "-.--", style_class: 'pp-value' });
        this._dataAmount = new St.Label({ text: "-.--", style_class: 'pp-value' });
        this._timeAmount = new St.Label({ text: "-:--", style_class: 'pp-value' });
        var _moneyAmount = this._moneyAmount;
        var _dataAmount = this._dataAmount;
        var _timeAmount = this._timeAmount;
        this.parent(concrete.title,function(box){
            box.add_child(_moneyAmount);
            box.add_child(new St.Label({ text: concrete.currencySymbol, style_class: 'pp-unit-label'}));
            box.add_child(_dataAmount);
            box.add_child(new St.Label({ text: concrete.capacitySymbol, style_class: 'pp-unit-label'}));
            box.add_child(_timeAmount);
            box.add_child(new St.Label({ text: concrete.timeSymbol, style_class: 'pp-unit-label'}));
        },_httpSession);
        log("back from parent");
    },

    collectData: function() {
        this.concrete.collectData(
            this._httpSession,
            (amountDto,flags) => {
                this._moneyAmount.text = Number(amountDto.money/100).toFixed(2);
                this._dataAmount.text = amountDto.data;
                this._timeAmount.text = amountDto.time;
                if (flags.warning) {
                    this._box.style_class = 'pp-box-layout warning';
                    _indicator.markForWarning();
                }
            }
        );
    }
});