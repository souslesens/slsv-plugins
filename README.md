# slsv-plugins
SousLeSensVocables-plugins


Repository of all available public plugins of SousLeSens.

## PluginExample

Plugin Example isn't a functional plugin but if you want to create a new plugin, you can copy it, it has the right structure of a complex plugin with several html, javascript and css files.  
Then rename PluginExample by your plugin name.  
Go to file plugins/PluginExample/public/js/main.js, the function onLoaded is executed when you click on it on SLS.  
Edit it as you want.  

## How plugins works

At the load of the application SLS check the plugins folder and dynamically add each Folder name to the tool list. They are display on the tool select list only if they are declared as available in the instance of SLS, this information is on mainConfig.tools_available list. 
Then for each plugin Folder, it add the public folder content dynamically to the navigator files.
The file main.js on the folder main is used as the equivalent of a tool controller and his function onLoaded is run when you select the tool. 


## GitHub

To sychronize your SousLeSensVocables project to the plugins, you need to do the following commands:

cd plugins

git init

git remote add origin https://github.com/souslesens/slsv-plugins.git

Then you can do your habituals commands like commit or fetch or a push from a branch


