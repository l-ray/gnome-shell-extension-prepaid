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

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;

const SETTINGS_SCHEMA ='de.l-ray.gnome.shell.extensions.prepaid-overview'
const ACCOUNTS_KEY = 'accounts';

let panelItemLabel;

const PrepaidMenuItem = new Lang.Class({
    Name: 'PrepaidMenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(title) {
	this.parent();

        // this.actor.add_child(this._icon);
        this._box = new St.BoxLayout({style_class: 'pp-box-layout'});
        this._label = new St.Label({ text: "-.--", style_class: 'pp-value' });
	this._box.add_child(new St.Label({ text: title, style_class: 'pp-label'}));	        
	this._box.add_child(this._label);
	this._box.add_child(new St.Label({ text: "€", style_class: 'pp-unit-label'}));	        
	this.actor.add(this._box);
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

  	  this._accounts.forEach(function(n){

            log("got item "+n);
            var concrete = Factory.getInstance(n)
	    var menuItem = new PrepaidMenuItem(concrete.title);
            this.menu.addMenuItem(menuItem);
        
            concrete.collectData(
    		_httpSession, 
		function(amount){
			// log("got amount "+amount);			
			menuItem._label.text = ""+amount;
		}
	    )

        },this);

    },

    destroy: function() {
        this.parent();
    },
  loadConfig: function() {
        this._settings = Convenience.getSettings(SETTINGS_SCHEMA);

        // if (this._cities.length === 0)
        //    this._cities = "-8.5211767,179.1976747>Vaiaku, Tuvalu>-1";

        this._settingsC = this._settings.connect("changed", Lang.bind(this, function() {
        //    this.rebuildButtonMenu();
        //    this.parseWeatherCurrent();
        }));
    },

    get _accounts() {
        if (!this._settings)
            this.loadConfig();
        return this._settings.get_string(ACCOUNTS_KEY).split(",");
    }
});


var _httpSession;


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
    _indicator.destroy();
}
