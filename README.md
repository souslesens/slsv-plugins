# slsv-plugins
SousLeSensVocables-plugin


All plugins of SousLeSens 


Plugin Example isn't a functional plugin but if you want to create a new plugin, you can copy it, it has the right structure to create one. 
Then rename PluginExample by your plugin name.
Go to mainConfig.json and add the name of your plugin to tools_available variable.
Restart your server and your navigator.
Your plugin will be available on SLS tools selection. 
Go to file plugins/PluginExample/public/js/main.js, the function onLoaded is executed when you click on it on SLS.
Edit it as you want.


//GitHub

To sychronize your SousLeSensVocables project to the plugins, you need to do the following commands:

cd plugins

git init

git remote add origin https://github.com/souslesens/slsv-plugins.git

Then you can do your habituals commands like commit or fetch or a push from a branch


