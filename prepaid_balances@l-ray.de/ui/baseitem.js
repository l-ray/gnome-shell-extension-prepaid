const Me = imports.misc.extensionUtils.getCurrentExtension();

const Lang = imports.lang;
const St = imports.gi.St;

const PopupMenu = imports.ui.popupMenu;

const PrepaidMenuItem = new Lang.Class({
    Name: 'PrepaidMenuItem',
    reactive: false,
    Extends: PopupMenu.PopupBaseMenuItem,
    _httpSession: Object(),
    concrete: Object(),

    _init: function(_title, _func, _httpSession) {
        log("in parent going deepre to sub-parent");
        this.parent();
        this._httpSession = _httpSession;
        var title = _title;

        // this.actor.add_child(this._icon);
        this._box = new St.BoxLayout({style_class: 'pp-box-layout'});
        this._box.add_child(new St.Label({ text: title, style_class: 'pp-label'}));
        _func(this._box);
        this.actor.add(this._box);
    },

    destroy: function() {
        if (this.concrete) {
            this.concrete.destroy();
        }
        if (this._changedId) {
            this._changedId = 0;
        }

        this.parent();
    },

    activate: function(event) {
        this.concrete.launchBalanceManagement();
        this._getTopMenu().actor.hide();
    }

});