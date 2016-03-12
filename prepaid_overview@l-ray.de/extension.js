const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const WebKit = imports.gi.WebKit;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Factory = Me.imports.provider.factory;

const Soup = imports.gi.Soup;

const Mainloop = imports.mainloop;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;

const Util = imports.misc.util;

const SETTINGS_SCHEMA ='de.l-ray.gnome.shell.extensions.prepaid-overview'
const ACCOUNTS_KEY = 'accounts';

const RELOAD_INTERVAL = 600000;

let panelItemLabel;

const PrepaidMenuItem = new Lang.Class({
    Name: 'PrepaidMenuItem',
    reactive: false,
    Extends: PopupMenu.PopupBaseMenuItem,
    concrete: Object(),
    _httpSession: Object(),

    _init: function(concrete, _httpSession) {
        this.parent();

        this.concrete = concrete;
        this._httpSession = _httpSession;
        // var title = "dummy";
        var title = concrete.title;

        // this.actor.add_child(this._icon);
        this._box = new St.BoxLayout({style_class: 'pp-box-layout'});
        this._label = new St.Label({ text: "-.--", style_class: 'pp-value' });
        this._box.add_child(new St.Label({ text: title, style_class: 'pp-label'}));
        this._box.add_child(this._label);
        this._box.add_child(new St.Label({ text: "€", style_class: 'pp-unit-label'}));
        this.actor.add(this._box);
        this.collectData();
    },

    collectData: function() {
        this.concrete.collectData(
            this._httpSession,
            (amount) => {
                // log("got amount "+amount);
                this._label.text = ""+amount;
            }
        );
    },

    destroy: function() {
        if (this._changedId) {
             this._changedId = 0;
        }

        this.parent();
    },

    activate: function(event) {
    	this.parent(event);
    },

});

const PrepaidMenu = new Lang.Class({
    Name: 'PrepaidMenu.PrepaidMenu',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, "Prepaid");

        let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        panelItemLabel = new St.Label({ text: "Prepaid",
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

	  log("my menu"+this.menu)
	  var menu = this.menu


        this._menuItems.forEach(function(n){
            log("got item "+n);
            this.menu.addMenuItem(n);
        },this);


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
            log('RELOAD not yet implemented')
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

        //this.reload(RELOAD_INTERVAL);

    },

    destroy: function() {
        this.parent();
    },

    loadConfig: function() {
        this._settings = Convenience.getSettings(SETTINGS_SCHEMA);

        this._settingsC = this._settings.connect("changed", Lang.bind(this, function() {
        //    this.rebuildButtonMenu();
        //    this.parseWeatherCurrent();
        }));
    },

    get _accounts() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_string(ACCOUNTS_KEY).split(",");
    },

    get _menuItems() {
        if (this._menuItemsInternal === undefined) {
            this._menuItemsInternal = this._accounts.map(
                function(n) {
                    var concrete = Factory.getInstance(n)
                    return new PrepaidMenuItem(concrete, _httpSession);
                }, this)
        }
        return this._menuItemsInternal;
    },

    set _menuItems(val) {
        this._menuItemsInternal = val
        return this._menuItemsInternal;
    },

    _onPreferencesActivate: function() {
        this.menu.actor.hide();
        Util.spawn(["gnome-shell-extension-prefs", "prepaid_overview@l-ray.de"]);
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
        this._timeoutCurrent = Mainloop.timeout_add_seconds(interval, Lang.bind(this, function() {
            // only invalidate cached data, if we can connect the weather-providers server
            /*if (this._connected && !this._idle)
                this.currentWeatherCache = undefined;
            this.parseWeatherCurrent(); */
            return true;
        }));
    },



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


