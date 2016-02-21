const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();

/*
 *  Base 'abstract' class for RSS parser. Every format inherits from this class
 *  and must implements all empty methods
 */
const BaseProvider = new Lang.Class({

    Name: 'BaseProvider',
    title: 'title',
    httpLink: 'http://test.de',

    /*
     *  Initialize the instance of BaseProvider class
     *  root - root element of feed file
     */
    _init: function(title,link) {
	this.title=title;
	this.httpLink=link;
    },

    /*
     *  Abstract function to Parse feed file
     */
    collectData: function(_httpSession, func) {
        // child classes implements this 'abstract' function
    }
});
