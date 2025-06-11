

import Lifex_cost_FiltersWidget from "./filtersWidget.js";


import Lifex_cost_YearlyDistribution from "./yearlyDistribution.js";
import Lifex_cost_JobCardController from "./jobCardController.js";
import Lifex_cost_HistoryManager from "./historyManager.js";



var Lifex_cost = (function() {
        var self = {};

        self.skipTagGeometry=true
        /*$('.vis-inner').filter(function() {
        return $(this).text()=='Structure';
        }).offset().top()*/
        self.planningSourceUri='http://data.total/resource/tsf/PRIMAVERA_REZA_17_07_2024/';
        self.currentSource = "DALIA_LIFEX_COSTS";

        self.setConfig=function(config){
            self.database=config.id;
        }
        self.onLoaded = function() {


            self.lifexUri=Config.sources[self.currentSource].graphUri;
            var fileName=self.currentSource+'_KGmodelGraph.json';
            var payload = {
                dir: "graphs/",
                fileName: fileName,
            };
            $.ajax({
                type: "GET",
                url: `${Config.apiUrl}/data/file`,
                data: payload,
                dataType: "json",
                success: function (result, _textStatus, _jqXHR) {
                    var data = JSON.parse(result);
                    self.KGqueryGraph=data;
                    $("#lateralPanelDiv").load("/plugins/Lifex_cost/html/leftPanel.html", function() {


                        $("#Lifex_cost_left_tabs").tabs({
        

                        });

                        
                        Lifex_cost_FiltersWidget.loadTree(self.currentSource);

                        //Lifex_cost_HistoryManager. loadHistoryDates()
                        var daily_values=[];
                        var yearly_values=[];
                        for(var key in Lifex_cost_JobCardController.quantityVarNamesMap){
                            if(Lifex_cost_JobCardController.quantityVarNamesMap[key].isDailyDistribution){
                                daily_values.push(key);
                            }else{
                                yearly_values.push(key);
                            }
                        }
        
                        
                        
        
                        common.fillSelectOptions("Lifex_cost_quantityVarSelect",yearly_values,false,null,null,'phaseCost');
                        common.fillSelectOptions("Lifex_cost_quantityVarSelect_daily",daily_values,false,null,null,'POB');
                        daily_values=[];
                        yearly_values=[];
                        for(var key in Lifex_cost_JobCardController.splitByVarNamesMap){
                            if(Lifex_cost_JobCardController.splitByVarNamesMap[key].isDailyDistribution){
                                daily_values.push(key);
                                yearly_values.push(key);
                            }else{
                                yearly_values.push(key);
                            }
                        }
                        
                        common.fillSelectOptions("Lifex_cost_SplitBySelect", yearly_values, true,null,null,'' );
                        common.fillSelectOptions("Lifex_cost_SplitBySelect_daily", daily_values, true,null,null,'');




                        $('#Lifex_cost_quantityVarSelect').on('change',function(evt){
                            var yAxisVal=$('#Lifex_cost_quantityVarSelect').val();
                            if(yAxisVal.indexOf('Ressource') > -1){
                                var jstreeData=[{
                                    id: "Resource",
                                    text: "Resource Type",
                                    parent: '#',
                                    data: {
                                        id: "Resource",
                                        label: "Resource Type"
                                    }
        
                                }];
                                JstreeWidget.addNodesToJstree(Lifex_cost_FiltersWidget.jstreeDiv, '#', jstreeData, null, function() {
                                   Lifex_cost_FiltersWidget.openTopNode('Resource',function(){
                                    /*var descendants=$("#" + Lifex_cost_FiltersWidget.jstreeDiv).jstree().get_node('Resource').children_d
                                    $("#" + Lifex_cost_FiltersWidget.jstreeDiv).jstree().check_node(descendants);*/
                                   });
        
                                   $('#Lifex_cost_SplitBySelect').append('<option value="Resource">Resource type</option>');
                                   $('#Lifex_cost_SplitBySelect').val('Resource');
                                });
        
        
                            }else{
                                $('#'+Lifex_cost_FiltersWidget.jstreeDiv).jstree().delete_node('Resource');
                                $("#Lifex_cost_SplitBySelect option[value='Resource']").remove();
        
                            }
                        });
        
                  /*     $("#tagsCalendarItemsSelect") .on("click",function(evt){
                           var selection=$(this).val()
                           if(evt.ctrlKey)
                          CustomNodeInfos.showNodeInfos(selection)
                          else if(evt.altKey)
                               Simulator.initSimulatorWidget(selection);
                           else{
                               TagsGeometry.highlightTags([selection]);
                           }
                       }).on( "dblclick" ,function(evt) {
                           var selection = $(this).val()
                            CustomNodeInfos.showNodeInfos(selection)
                       })*/
        
        
        
                        $("#graphDiv").load("/plugins/Lifex_cost/html/rightPanel.html", function(x, y) {
                         //  TagsGeometry.drawAllTags("crossSection",function(err,decksMap){
        
                            if(!Lifex_cost.skipTagGeometry) {
                                TagsGeometry.drawAllTags("plan", function(err, decksMap) {
        
                                  /*      var html = "";
                                        for (var deck in decksMap) {
                                            html += "&nbsp;<span style='font-weight:bold;background-color:" + decksMap[deck] + "'>" + deck + "</span>&nbsp;";
                                        }
                                        $("#tagsGeometryDecksDiv").html(html);*/
        
                                })
                            }
                            $("#Lifex_cost_right_tabs").tabs({
        
                              /*  create: function(event, ui) {
                                    $("[aria-selected='true']").addClass("nodesInfos-selectedTab");
                                },
                                        activate: function (event, ui) {
                                            $(".nodeInfosWidget_tabDiv").removeClass("nodesInfos-selectedTab");
                        
                                            setTimeout(function () {
                                                $("[aria-selected='true']").addClass("nodesInfos-selectedTab");
                                                if ($(ui.newTab).text() == "Simulator") {
                                                   GanttSimulation.showSimulationTable();
                                                }
                                                
                                            }, 100);
                                        },*/
                            })
        
        
                            $( "#tagNeigborhoodSlider" ).slider({
                                min:0,
                                max:50,
                                value:0,
                                create: function() {
        
                                    $( "#tagNeigborhoodSliderHandle" ).text( $( this ).slider( "value" ) );
                                },
                                slide: function( event, ui ) {
                                    $( "#tagNeigborhoodSliderHandle" ).text( ui.value );
                                    TagGeometry.selectTagsAroundTag()
                                }
                            });
                        });
                       /* $("#Lifex_cost_SplitBySelect").val("Activity")
                        Lifex_cost_FiltersWidget.draw2dChart();*/
        
        
                      //  });
                    });

                } ,error(err) {
                    
                    //generate the KGquery graph 
                    return alert(err);
                }
            });
            
        };




    




        return self;


    }


)
();
export default Lifex_cost;
window.Lifex_cost = Lifex_cost;