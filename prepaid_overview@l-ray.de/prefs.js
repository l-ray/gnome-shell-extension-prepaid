/* jshint esnext:true */

const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Gettext = imports.gettext.domain('gnome-shell-extension-prepaid-overview');
const _ = Gettext.gettext;
const Soup = imports.gi.Soup;

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;
const Convenience = Me.imports.convenience;
const Factory = Me.imports.provider.factory;


const EXTENSIONDIR = Me.dir.get_path();

const SETTINGS_SCHEMA ='de.l-ray.gnome.shell.extensions.prepaid-overview'
const ACCOUNTS_KEY = 'accounts'

// Keep enums in sync with GSettings schemas
const ProviderTemplate = {
    // DEFAULT: -1,
    SIPGATE: 0,
    TESCO_MOBILE_IE: 1
};

let _httpSession;

let mCities = null;

let inRealize = false;

let defaultSize = [-1, -1];

const PrepaidOverviewPrefsWidget = new GObject.Class({
    Name: 'PrepaidOverviewExtension.Prefs.Widget',
    GTypeName: 'PrepaidOverviewExtensionPrefsWidget',
    Extends: Gtk.Box,

    actual_city: 0,

    _init: function(params) {
        this.parent(params);

        // Create user-agent string from uuid and (if present) the version
        this.user_agent = Me.metadata.uuid;
        if (Me.metadata.version !== undefined && Me.metadata.version.toString().trim() !== '') {
            this.user_agent += '/';
            this.user_agent += Me.metadata.version.toString();
        }
        // add trailing space, so libsoup adds its own user-agent
        this.user_agent += ' ';

        this.initWindow();

        defaultSize = this.MainWidget.get_size_request();
        var borderWidth = this.MainWidget.get_border_width();

        defaultSize[0] += 2 * borderWidth;
        defaultSize[1] += 2 * borderWidth;

        this.MainWidget.set_size_request(-1, -1);
        this.MainWidget.set_border_width(0);

        this.refreshUI();

        this.add(this.MainWidget);
        this.MainWidget.connect('realize', Lang.bind(this, function() {
            if (inRealize)
                return;
            inRealize = true;

            this.MainWidget.get_toplevel().resize(defaultSize[0], defaultSize[1]);
            inRealize = false;
        }));
    },

    Window: new Gtk.Builder(),

    initWindow: function() {
        mCities = null;

        this.Window.add_from_file(EXTENSIONDIR + "/prepaid-settings.ui");

        this.MainWidget = this.Window.get_object("main-widget");
        this.treeview = this.Window.get_object("tree-treeview");
        this.liststore = this.Window.get_object("tree-liststore");
        this.editWidget = this.Window.get_object("edit-widget");
        
	this.editName = this.Window.get_object("edit-name");
        this.editLogin = this.Window.get_object("edit-login");
        this.editCombo = this.Window.get_object("edit-combo");
        this.editPassword = this.Window.get_object("edit-password");
/*        
	this.searchWidget = this.Window.get_object("search-widget");
        this.searchMenu = this.Window.get_object("search-menu");
        this.searchName = this.Window.get_object("search-name");
        this.searchCombo = this.Window.get_object("search-combo");
        this.spinner = this.Window.get_object("spinner");

        this.searchName.connect("icon-release", Lang.bind(this, this.clearEntry));
*/
        this.editName.connect("icon-release", Lang.bind(this, this.clearEntry));
        this.editLogin.connect("icon-release", Lang.bind(this, this.clearEntry));
        this.editPassword.connect("icon-release", Lang.bind(this, this.clearEntry));

        this.Window.get_object("tree-toolbutton-add").connect("clicked", Lang.bind(this, function() {
		this.city=this.city+","+Factory.serializeCredentialString({label:'',instanceName:'',login:'',password:''});
		this.actual_city = this.city.split(",").length-1;            
		this.editCity();
        }));

        this.Window.get_object("tree-toolbutton-remove").connect("clicked", Lang.bind(this, this.removeCity));

        this.Window.get_object("tree-toolbutton-edit").connect("clicked", Lang.bind(this, this.editCity));

        this.Window.get_object("treeview-selection").connect("changed", Lang.bind(this, function(selection) {
            this.selectionChanged(selection);
        }));

        this.Window.get_object("button-edit-cancel").connect("clicked", Lang.bind(this, this.editCancel));

        this.Window.get_object("button-edit-save").connect("clicked", Lang.bind(this, this.editSave));

	/* Account Name */
        let column = new Gtk.TreeViewColumn();
        column.set_title(_("Account"));
        this.treeview.append_column(column);

        let renderer = new Gtk.CellRendererText();
        column.pack_start(renderer, null);

        column.set_cell_data_func(renderer, function() {
            arguments[1].markup = arguments[2].get_value(arguments[3], 0);
        });
        
	/* choosen Provider */
	column = new Gtk.TreeViewColumn();
        column.set_title(_("Provider"));
        this.treeview.append_column(column);

        column.pack_start(renderer, null);

        column.set_cell_data_func(renderer, function() {
		arguments[1].markup = arguments[2].get_value(arguments[3], 1);
        });

	/* Login */	
	column = new Gtk.TreeViewColumn();
        column.set_title(_("Login"));
        this.treeview.append_column(column);

        column.pack_start(renderer, null);

        column.set_cell_data_func(renderer, function() {
            arguments[1].markup = arguments[2].get_value(arguments[3], 2);
        });

	/* Password */
	column = new Gtk.TreeViewColumn();
        column.set_title(_("Password"));
        this.treeview.append_column(column);

        column.pack_start(renderer, null);

        column.set_cell_data_func(renderer, function() {
		arguments[1].markup = arguments[2].get_value(arguments[3], 3);
        });


        let theObjects = this.Window.get_objects();
        for (let i in theObjects) {
            log("object("+i+"):"+theObjects)
            let name = theObjects[i].get_name ? theObjects[i].get_name() : 'dummy';
            if (this[name] !== undefined) {
                if (theObjects[i].class_path()[1].indexOf('GtkEntry') != -1)
                    this.initEntry(theObjects[i]);
                else if (theObjects[i].class_path()[1].indexOf('GtkComboBoxText') != -1)
                    this.initComboBox(theObjects[i]);
                else if (theObjects[i].class_path()[1].indexOf('GtkSwitch') != -1)
                    this.initSwitch(theObjects[i]);
                this.configWidgets.push([theObjects[i], name]);
            }
        }
        if (Me.metadata.version !== undefined)
            this.Window.get_object('version').set_label(Me.metadata.version.toString());
    },

    clearEntry: function() {
        arguments[0].set_text("");
    },

    onActivateItem: function() {
        this.searchName.set_text(arguments[0].get_label());
    },
/*
    placeSearchMenu: function() {
        let[gx, gy, gw, gh] = this.searchName.get_window().get_geometry();
        let[px, py] = this.searchName.get_window().get_position();
        return [gx + px, gy + py + this.searchName.get_allocated_height()];
    },

    clearSearchMenu: function() {
        let children = this.searchMenu.get_children();
        for (let i in children) {
            this.searchMenu.remove(children[i]);
        }
    },
*/
    initEntry: function(theEntry) {
        let name = theEntry.get_name();
        theEntry.text = this[name];
        if (this[name].length != 32)
            theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, 'dialog-warning');

        theEntry.connect("notify::text", Lang.bind(this, function() {
            let key = arguments[0].text;
            this[name] = key;
            if (key.length == 32)
                theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, '');
            else
                theEntry.set_icon_from_icon_name(Gtk.PositionType.LEFT, 'dialog-warning');
        }));
    },

    initComboBox: function(theComboBox) {
        let name = theComboBox.get_name();
        theComboBox.connect("changed", Lang.bind(this, function() {
            this[name] = arguments[0].active;
        }));
    },

    initSwitch: function(theSwitch) {
        let name = theSwitch.get_name();
        theSwitch.connect("notify::active", Lang.bind(this, function() {
            this[name] = arguments[0].active;
        }));
    },

    refreshUI: function() {
        this.MainWidget = this.Window.get_object("main-widget");
        this.treeview = this.Window.get_object("tree-treeview");
        this.liststore = this.Window.get_object("tree-liststore");

	        
	this.Window.get_object("tree-toolbutton-remove").sensitive = Boolean(this.city.length);
        this.Window.get_object("tree-toolbutton-edit").sensitive = Boolean(this.city.length);


        if (mCities != this.city) {
            if (this.liststore !== undefined)
                this.liststore.clear();

            if (this.city.length > 0) {
                let city = this.city.split(",").map(function(n){ 
			var unserialized = Factory.unserializeCredentialString(n)
			log(n+" translates to "+unserialized)
			return Factory.unserializeCredentialString(n);
		})

		/*                
		if (city && typeof city == "string")
                    city = [city];
		*/

                let current = this.liststore.get_iter_first();

                for (let i in city) {
                    current = this.liststore.append();
                    this.liststore.set_value(current, 0, city[i].label);
                    this.liststore.set_value(current, 1, city[i].instanceName);
                    this.liststore.set_value(current, 2, city[i].login);
                    this.liststore.set_value(current, 3, city[i].password);
                    
                }
            }

            mCities = this.city;
        }

       
        this.changeSelection();
      
        let config = this.configWidgets;
        for (let i in config) {
            if (config[i][0].active != this[config[i][1]])
                config[i][0].active = this[config[i][1]];
        }
    },

    configWidgets: [],

    selectionChanged: function(select) {
        let a = select.get_selected_rows(this.liststore)[0][0];
	log("choosen a with "+a)
        if (a !== undefined)
            if (this.actual_city != parseInt(a.to_string()))
                this.actual_city = parseInt(a.to_string());
    },

    removeCity: function() {
        let city = this.city.split(",");
        if (!city.length)
            return 0;
        let ac = this.actual_city;
        let textDialog = _("Remove %s ?").format(city[ac]);
        let dialog = new Gtk.Dialog({
            title: ""
        });
        let label = new Gtk.Label({
            label: textDialog
        });
        label.margin_bottom = 12;

        dialog.set_border_width(12);
        dialog.set_modal(1);
        dialog.set_resizable(0);
        //dialog.set_transient_for(***** Need parent Window *****);

        dialog.add_button(Gtk.STOCK_NO, 0);
        let d = dialog.add_button(Gtk.STOCK_YES, 1);

        d.set_can_default(true);
        dialog.set_default(d);

        let dialog_area = dialog.get_content_area();
        dialog_area.pack_start(label, 0, 0, 0);
        dialog.connect("response", Lang.bind(this, function(w, response_id) {
            if (response_id) {
                if (city.length === 0)
                    city = [];

                if (city.length > 0 && typeof city != "object")
                    city = [city];

                if (city.length > 0)
                    city.splice(ac, 1);

                if (city.length > 1)
                    this.city = city.join(",");
                else if (city[0])
                    this.city = city[0];
                else
                    this.city = "";
            }
            dialog.hide();
            return 0;
        }));

        dialog.show_all();
        return 0;
    },

    editCity: function() {
	let city = this.city.split(",").map(function(n){return Factory.unserializeCredentialString(n);});
        if (!city.length)
            return 0;
        let ac = this.actual_city;
	
	log("log:"+city[ac].label)        
	this.editName.set_text(city[ac].label);
        this.editCombo.set_active(this.calculateActiveCombo(city[ac].instanceName));
        this.editLogin.set_text(city[ac].login);
        this.editPassword.set_text(city[ac].password);

        this.editWidget.show_all();
        return 0;
    },

    calculateActiveCombo: function(s) {
	var activeCombo = ProviderTemplate[s]
        
        if (activeCombo == undefined) return -1

        return activeCombo
    },

    /*
    searchSave: function() {
        let location = this.searchName.get_text().split(/\[/)[0];
        let coord = this.searchName.get_text().split(/\[/)[1].split(/\]/)[0];
        let provider = this.searchCombo.get_active() - 1;

        if (this.city)
            this.city = this.city + " && " + coord + ">" + location + ">" + provider;
        else
            this.city = coord + ">" + location + ">" + provider;

        this.searchWidget.hide();
        return 0;
    },*/

    editSave: function() {
        let theCity = this.city.split(",");

        if (theCity.length === 0)
            return 0;
        if (theCity.length > 0 && typeof theCity != "object")
            theCity = [theCity];

        let ac = this.actual_city;

        theCity[ac] = Factory.serializeCredentialString({
		label: this.editName.get_text(),
	 	login: this.editLogin.get_text(),
        	password: this.editPassword.get_text(),
		instanceName: Object.getOwnPropertyNames(ProviderTemplate)[this.editCombo.get_active()]
	});

        if (theCity.length > 1)
            this.city = theCity.join(",");
        else if (theCity[0])
            this.city = theCity[0];

        this.editWidget.hide();

        this.actual_city = ac;

        return 0;
    },

    editCancel: function() {
        this.editName.set_text("");
        this.editLogin.set_text("");
        this.editPassword.set_text("");
	this.editCombo.set_active(-1);
        this.editWidget.hide();
    },

    changeSelection: function() {
        let path = 0;
        if (arguments[0])
            path = arguments[0];
        path = Gtk.TreePath.new_from_string(String(path));
        this.treeview.get_selection().select_path(path);
    },

    loadConfig: function() {
        this.Settings = Convenience.getSettings(SETTINGS_SCHEMA);
        this.Settings.connect("changed", Lang.bind(this, function() {
            this.refreshUI();
        }));
    },

    get city() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_string(ACCOUNTS_KEY);
    },

    set city(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_string(ACCOUNTS_KEY, v);
    },


    get refresh_interval_current() {
        if (!this.Settings)
            this.loadConfig();
        let v = this.Settings.get_int(OPENWEATHER_REFRESH_INTERVAL_CURRENT);
        return ((v >= 600) ? v : 600);
    },

    set refresh_interval_current(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_int(OPENWEATHER_REFRESH_INTERVAL_CURRENT, ((v >= 600) ? v : 600));
    }
});

function init() {
    Convenience.initTranslations('gnome-shell-extension-prepaid-overview');
}

function buildPrefsWidget() {
    let widget = new PrepaidOverviewPrefsWidget();
    widget.show_all();
    return widget;
}
