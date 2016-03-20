/* jshint esnext:true */

const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Gettext = imports.gettext.domain('gnome-shell-extension-prepaid-balances');
const _ = Gettext.gettext;

const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Factory = Me.imports.provider.factory;


const EXTENSIONDIR = Me.dir.get_path();

const SETTINGS_SCHEMA ='de.l-ray.gnome.shell.extensions.prepaid-balances';
const ACCOUNTS_KEY = 'accounts';

// Keep enums in sync with GSettings schemas
const ProviderTemplate = {
    // DEFAULT: -1,
    SIPGATE: 0,
    TESCO_MOBILE_IE: 1
};

let mCities = null;

let inRealize = false;

let defaultSize = [-1, -1];

const PrepaidOverviewPrefsWidget = new GObject.Class({
    Name: 'PrepaidOverviewExtension.Prefs.Widget',
    GTypeName: 'PrepaidOverviewExtensionPrefsWidget',
    Extends: Gtk.Box,

    actual_account: 0,

    _init: function(params) {
        this.parent(params);

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

        this.editName.connect("icon-release", Lang.bind(this, this.clearEntry));
        this.editLogin.connect("icon-release", Lang.bind(this, this.clearEntry));
        this.editPassword.connect("icon-release", Lang.bind(this, this.clearEntry));

        this.Window.get_object("tree-toolbutton-add").connect("clicked", Lang.bind(this, function() {
            var accountPrefix = (this.account && this.account.length>0)?this.account+",":"";
            this.account=accountPrefix+Factory.serializeCredentialString({label:'',instanceName:'',login:''});
            this.actual_account = this.account.split(",").length-1;
            this.editAccount();
        }));

        this.Window.get_object("tree-toolbutton-remove").connect("clicked", Lang.bind(this, this.removeAccount));

        this.Window.get_object("tree-toolbutton-edit").connect("clicked", Lang.bind(this, this.editAccount));

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

    	/* additional */
        /*
	    column = new Gtk.TreeViewColumn();
        column.set_title(_("Password"));
        this.treeview.append_column(column);

        column.pack_start(renderer, null);

        column.set_cell_data_func(renderer, function() {
		arguments[1].markup = arguments[2].get_value(arguments[3], 3);
        });
        */

        let theObjects = this.Window.get_objects();
        for (let i in theObjects) {
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
        /*if (Me.metadata.version !== undefined)
            this.Window.get_object('version').set_label(Me.metadata.version.toString()); */
    },

    clearEntry: function() {
        arguments[0].set_text("");
    },

    /*
    onActivateItem: function() {
        this.searchName.set_text(arguments[0].get_label());
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

	        
    	this.Window.get_object("tree-toolbutton-remove").sensitive = Boolean(this.account.length);
        this.Window.get_object("tree-toolbutton-edit").sensitive = Boolean(this.account.length);


        if (mCities != this.account) {
            if (this.liststore !== undefined)
                this.liststore.clear();

            if (this.account.length > 0) {
                let account = this.account.split(",").map(function(n){
                   return Factory.unserializeCredentialString(n);
                });

                let current = this.liststore.get_iter_first();

                for (let i in account) {
                    current = this.liststore.append();
                    this.liststore.set_value(current, 0, account[i].label);
                    this.liststore.set_value(current, 1, account[i].instanceName);
                    this.liststore.set_value(current, 2, account[i].login);
                    this.liststore.set_value(current, 3, "is kept in keystore");

                }
            }

            mCities = this.account;
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
        if (a !== undefined)
            if (this.actual_account != parseInt(a.to_string()))
                this.actual_account = parseInt(a.to_string());
    },

    removeAccount: function() {
        let account = this.account.split(",");
        if (!account.length)
            return 0;
        let ac = this.actual_account;
        let textDialog = _("Remove %s ?").format(account[ac]);
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
                if (account.length === 0)
                    account = [];

                if (account.length > 0 && typeof account != "object")
                    account = [account];

                try {
                log("actual account:"+account[this.actual_account]+" on account "+account);
                Factory.getInstance(account[this.actual_account]).removePassword();
                } catch (ex) {
                    log("Could not remove password from keyring.");
                }

                if (account.length > 0) {
                    account.splice(ac, 1);
                }

                if (account.length > 1)
                    this.account = account.join(",");
                else if (account[0])
                    this.account = account[0];
                else
                    this.account = "";
            }
            dialog.hide();
            return 0;
        }));

        dialog.show_all();
        return 0;
    },

    editAccount: function() {
	    if (!this.account.length) {
            return 0;
        }
        let account = this.account.split(",").map(function(n){return Factory.unserializeCredentialString(n);});
        if (!account.length)
            return 0;
        let ac = this.actual_account;
	
	    log("log:"+account[ac].label);
	    this.editName.set_text(account[ac].label);
        this.editCombo.set_active(this.calculateActiveCombo(account[ac].instanceName));
        this.editLogin.set_text(account[ac].login);
        this.editPassword.set_text("retrieving from keystore");
        try {
            var provider = Factory.getInstanceFromParam(
                {
                    label:account[ac].label,
                    instanceName:account[ac].instanceName,
                    login:account[ac].login
                });
            provider.retrievePassword((pw) => {
                this.editPassword.set_text(pw);
            })
        } catch (ex) {
            log(ex);
            this.editPassword.set_text("");
        }

        this.editWidget.show_all();
        return 0;
    },

    calculateActiveCombo: function(s) {
	var activeCombo = ProviderTemplate[s]
        
        if (activeCombo == undefined) return -1

        return activeCombo
    },

    editSave: function() {
        let theAccount = this.account.split(",");

        if (theAccount.length === 0)
            return 0;
        if (theAccount.length > 0 && typeof theAccount != "object")
            theAccount = [theAccount];

        let ac = this.actual_account;

        theAccount[ac] = Factory.serializeCredentialString({
            label: this.editName.get_text(),
            login: this.editLogin.get_text(),
            password: this.editPassword.get_text(),
            instanceName: Object.keys(ProviderTemplate)[this.editCombo.get_active()]
	    });

        this.savePassword(
            theAccount[ac],
            this.editPassword.get_text()
        );

        if (theAccount.length > 1)
            this.account = theAccount.join(",");
        else if (theAccount[0])
            this.account = theAccount[0];

        this.editWidget.hide();

        this.actual_account = ac;

        return 0;
    },

    savePassword: function(instance,pw) {
        try {
            var provider = Factory.getInstance(instance);
            provider.savePassword(pw)
        } catch (ex) {log(ex);}

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

    get account() {
        if (!this.Settings)
            this.loadConfig();
        return this.Settings.get_string(ACCOUNTS_KEY);
    },

    set account(v) {
        if (!this.Settings)
            this.loadConfig();
        this.Settings.set_string(ACCOUNTS_KEY, v);
    }
});

function init() {
    Convenience.initTranslations('gnome-shell-extension-prepaid-balances');
}

function buildPrefsWidget() {
    let widget = new PrepaidOverviewPrefsWidget();
    widget.show_all();
    return widget;
}