const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Factory = Me.imports.provider.factory;
const UIFactory = Me.imports.ui.factory;

const Soup = imports.gi.Soup;

const Mainloop = imports.mainloop;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;

const PrepaidMenuItem = Me.imports.ui.baseitem;

const Util = imports.misc.util;

const SETTINGS_SCHEMA ='de.l-ray.gnome.shell.extensions.prepaid-balances'
const ACCOUNTS_KEY = 'accounts';
const DEFAULT_REFRESH_INTERVAL = 600; // in seconds
const REFRESH_INTERVAL_KEY = 'refresh-interval-current';

let panelItemLabel;

const PrepaidMenu = new Lang.Class({
    Name: 'PrepaidMenu.PrepaidMenu',
    Extends: PanelMenu.Button,
    _balancesSection: Object(),

    _init: function() {
        this.parent(0.0, "Prepaid");

        let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        panelItemLabel = new St.Label({ text: "$",
                                   y_expand: true,
                                   y_align: Clutter.ActorAlign.CENTER });
        hbox.add_child(panelItemLabel);
        hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_actor(hbox);

        if (_httpSession === undefined) {
           _httpSession = new Soup.Session();
        } else {
            // abort previous requests.
            _httpSession.abort();
        }

        var menu = this.menu;

        this._balancesSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._balancesSection);

        /* adding buttons on bottom of window - START */
	    this._buttonMenu = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            style_class: 'prepaid_overview-menu-button-container'
        });
        this.menu.addMenuItem(this._buttonMenu);

        this._buttonBox1 = new St.BoxLayout({
            style_class: 'prepaid_overview-button-box'
        });


        this._reloadButton = this.createButton('view-refresh-symbolic', "Reload Account Balances Information");
        this._reloadButton.connect('clicked', Lang.bind(this, function() {
            this.reload(this._refreshInterval);
        }));
        this._buttonBox1.add_actor(this._reloadButton);

        this._buttonBox2 = new St.BoxLayout({
            style_class: 'openweather-button-box'
        });

        this._prefsButton = this.createButton('preferences-system-symbolic', _("Account Settings"));
   
        this._prefsButton.connect('clicked', Lang.bind(this, this._onPreferencesActivate));
        this._buttonBox2.add_actor(this._prefsButton);

        this._buttonMenu.actor.add_actor(this._buttonBox1);
        this._buttonMenu.actor.add_actor(this._buttonBox2);
 
        /* adding buttons on bottom of window - END */

        this.buildBalances();
        this.reload(this._refreshInterval);

    },

    destroy: function() {
        this._menuItems.forEach((mi) => {mi.destroy();});
        this.parent();
    },

    loadConfig: function() {
        this._settings = Convenience.getSettings(SETTINGS_SCHEMA);

        this._settingsC = this._settings.connect("changed", Lang.bind(this, function() {
            log("detected that schema was changed!");
            this.buildBalances();
            this.reload(this._refreshInterval);
        }));
    },

    buildBalances: function(){
        this._balancesSection.removeAll();
        try {
            this._menuItemsInternal.forEach(function(n){ n.destroy();});
            this._menuItemsInternal = undefined;
        } catch (e) {}
        this._menuItems.forEach(function(n){
            log("got item "+n);
            this._balancesSection.addMenuItem(n);
        },this);
    },

    get _accounts() {
        if (!this._settings)
            this.loadConfig();
        var accountKeys = this._settings.get_string(ACCOUNTS_KEY);
        return accountKeys !== undefined && accountKeys.length > 0 ? accountKeys.split(","):[];
    },

    get _refreshInterval() {
        if (!this._settings)
            this.loadConfig();
        var interval = this._settings.get_int(REFRESH_INTERVAL_KEY);
	    return interval !== undefined && interval > 0 ? Number(interval) : DEFAULT_REFRESH_INTERVAL;
    },

    get _menuItems() {
        if (this._menuItemsInternal === undefined) {
            try {
            this._menuItemsInternal = this._accounts.map(
                function(n) {
                    var concrete = Factory.getInstance(n);
                    log("Calling UI factory");
                    return UIFactory.getInstance(concrete, _httpSession);
                }, this)
            } catch (ex) {
                log("parsing error creating menu items:"+ex);
                this._menuItemsInternal = [];
            }
        }
        return this._menuItemsInternal;
    },

    set _menuItems(val) {
        this._menuItemsInternal = val;
        return this._menuItemsInternal;
    },

    _onPreferencesActivate: function() {
        this.menu.actor.hide();
        Util.spawn(["gnome-shell-extension-prefs", "prepaid_balances@l-ray.de"]);
        return 0;
    },
    createButton: function(iconName, accessibleName) {
        let button;

        button = Main.panel.statusArea.aggregateMenu._system._createActionButton(iconName, accessibleName);

        return button;
    },

    stop: function() {
        if (_httpSession !== undefined)
            _httpSession.abort();

        _httpSession = undefined;

        if (this._timeoutCurrent)
            Mainloop.source_remove(this._timeoutCurrent);

        this._timeoutCurrent = undefined;
    },

    reload: function(interval) {
        if (this._timeoutCurrent) {
            Mainloop.source_remove(this._timeoutCurrent);
            this._timeoutCurrent = undefined;
        }
        // _timeCacheCurrentWeather = new Date();
        var _menuItems = this._menuItems;
        this._timeoutCurrent = Mainloop.timeout_add_seconds(interval, Lang.bind(this, function() {
            // only invalidate cached data, if we can connect the providers server
            /*if (this._connected && !this._idle)
                this.currentWeatherCache = undefined; */
            _menuItems.forEach((n) => n.collectData());
            this.markForWarning(false);
            return true;
        }));
        this._menuItems.forEach((n) => n.collectData());
        this.markForWarning(false);
    },

    markForWarning: function(status = true) {
        panelItemLabel.style_class = status ? 'warning' : '';
    }
});


let _httpSession;


function init() {
}

let _indicator;

function enable() {
    _indicator = new PrepaidMenu;

    let pos = 1;
    if ('apps-menu' in Main.panel.statusArea)
	    pos = 2;
    Main.panel.addToStatusArea('prepaid-menu', _indicator, pos, 'right');
    // load_json_async()
}

function disable() {
    _indicator.stop();
    _indicator.destroy();
    _indicator = undefined;
}