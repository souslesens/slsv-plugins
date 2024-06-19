# slsv-plugins
SousLeSensVocables-plugins


Repository of all available public plugins of SousLeSens.

## PluginExample

The "Plugin Example" isn't a functional plugin, but if you wish to create a new plugin, you can duplicate it. It contains the correct structure of a complex plugin with multiple HTML, JavaScript, and CSS files.
Then rename PluginExample by your plugin name.  
Go to file plugins/PluginExample/public/js/main.js, the function onLoaded is executed when you click on it on SLS.  
Edit it as you want.  

## How plugins works

Upon the loading of the SLS application, the plugins folder is check and  each folder name is dynamically added to the tool list. They are displayed in the tool selection list only if they are declared as available in the instance of SLS, this information is on the mainConfig.tools_available list.

Then, for each plugin folder,  the content of the public folder is dynamically added to the navigator files. The main.js file in the main folder serves as the equivalent of a tool controller, and it's onLoaded function is executed when you select the tool.


## GitHub

To sychronize your SousLeSensVocables project plugin folder to the plugins repository, you need to do the following commands at the project root :
````
    cd plugins
    git init
    git remote add origin https://github.com/souslesens/slsv-plugins.git
```
Then, you can execute your usual commands such as commit, fetch, or push. 


