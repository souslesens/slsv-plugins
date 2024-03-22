



var TimeLine_myQueries = (function() {

  var self = {};


  self.save = function(callback) {
   var params={}
    $("#controlAxisPannel select").each(function(item){
      params[this.id]={id:$(this).val(),label:$("#"+this.id+" option:selected").text()};
    });

    return callback(null,params)







   

  };


  self.load = function(err, result) {
    if (err) {
      return alert(err.responseText);
    }
    $("#TimeLine_leftPanelTabs").tabs("option","active",0);
    if($('#DatesDiv').children().length==0){
      $('#DatesDiv').load("/plugins/TimeLine/html/selectDates.html",function () { 
        if($('#AggregationDiv').children().length==0){
            $("#AggregationDiv").load("/plugins/TimeLine/html/selectAggregation.html",function () { 
                self.setResultOnInputs(result);
      
            });
        }
        else{
          self.setResultOnInputs(result);
        }
      });
    }
   else{
    self.setResultOnInputs(result);
   }
   



  };

  self.setResultOnInputs=function(result){
    Object.keys(result).forEach(item=>{

      common.fillSelectOptions(item,[result[item]],false,"label","id",result[item].id);
      /*
      $('#'+item).val(.id);
      $('#'+item).text(result[item].label);
      */
    });
    TimeLine.skipSuccesivePannelLaunchForMyQuery=true;
  };


  return self;


})();

export default TimeLine_myQueries;
window.TimeLine_myQueries = TimeLine_myQueries