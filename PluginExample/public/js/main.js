import functions from "./secondary.js";

var Test = (function () {
    var self = {};

    self.onLoaded = function () {
        functions.function_of_secondary_file();
        $("#graphDiv").load('/plugins/PluginExample/index.html',function() {
            console.log( " loaded" );
          });
    }
return self;
})();

export default Test;
window.Test = Test;
