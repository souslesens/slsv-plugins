var POC_equipement = (function () {
    var self = {};

    self.onLoaded = function () {
        
        $("#graphDiv").load('/plugins/POC_equipement/html/mainPage.html',function() {
           
        });
    }
return self;
})();

export default POC_equipement;
window.POC_equipement = POC_equipement;
