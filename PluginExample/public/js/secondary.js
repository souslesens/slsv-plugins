
var functions = (function () {
    var self = {};

    self.function_of_secondary_file=function(){
        console.log("I'm using a function of my second file'");
    }
return self;
})();

export default functions;
window.functions = functions;
