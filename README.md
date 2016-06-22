# gnome-shell-extension-prepaid

This is a simple Gnome shell extension for displaying your current prepaid balance with multiple services. The current balance is fetched using the providers public APIs and shown in a panel. The passwords for accessing your accounts on the provider APIs are safely stored in Gnome Keyring.

![screenshot prepaid balance](https://raw.githubusercontent.com/l-ray/gnome-shell-extension-prepaid/master/static/screenshot.png "Screenshot prepaid balance overview")

## Installation
 1. get the project (i.e. using git or downloading the [project as zip](https://github.com/l-ray/gnome-shell-extension-prepaid/archive/master.zip))
 1. copy the directory `prepaid_balances@l-ray.de` to `$HOME/.local/share/gnome-shell/extensions/`
 1. activate extension using [Gnome Tweak Tool](wiki.gnome.org/action/show/Apps/GnomeTweakTool)

Alternatively load extension from the [Gnome Extensions](https://extensions.gnome.org/extension/1053/pre-paid-balances/) web page.
## Supports:
 * Sipgate (incl. Simquadrat)
 * Tesco Mobile Ireland
 * Leapcard

## License

This Gnome shell extension is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License as published by the Free Software Foundation, either version 3** of the License, or (at your option) any later version.

This Gnome shell extension is distributed in the hope that it will be useful, but **WITHOUT ANY WARRANTY**; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this gnome shell extension. If not, see http://www.gnu.org/licenses/.
