import Charts from "./charts.js";
import Lifex_cost_FiltersWidget from "./filtersWidget.js";
import Lifex_cost from "./main.js";
import Lifex_cost_SparqlQueries from "./sparqlQueries.js";
import Lifex_cost_YearlyDistribution from "./yearlyDistribution.js";


var Lifex_cost_JobCardController = (function () {
    var self = {}
    self.datatableDivId = "Lifex_cost_jobcardTableDiv"

    self.quantityVarNamesMap={
        "phaseCost":{ varName: "phaseCost",isDailyDistribution:false},
        "CAPEX":{ varName: "JobCard_CAPEX",isDailyDistribution:false},
        "POB":{ varName: "OffshoreConstructionPhase_POB",isDailyDistribution:true},
        "offshoreManHours":{ varName: "OffshoreConstructionPhase_OffshoreManHours",isDailyDistribution:true},
        /*"CPY costs":{ varName: "JobCard_CPYcosts"},
        "Contingencies ":{ varName: "JobCard_contingenciesCost"},*/
    }
    
    self.splitByVarNamesMap={
        "Phase":{varName:"phaseType_label",isDailyDistribution:true},
        "Discipline":{varName:"Discipline_label",isDailyDistribution:true},
        "Cost Type":{varName:""}
    }


    self.showTable = function () {

        //var filter = "FILTER (?JobCard_CAPEX > \"10\"^^xsd:float ) "

        var options={};
        var filterObj=Lifex_cost_FiltersWidget.getFilter({addPhase:true});
        var filter=filterObj.filter || "";

            options.subQueries=filterObj.subQueries;

        Lifex_cost_SparqlQueries.executeJobcardListQuery(filter, options, function (err, result) {
            $("#Lifex_cost_right_tabs").tabs("option", "active", 0);
            Lifex_cost_FiltersWidget.setTitle(null,true);
            if (err) {
                return alert(err)
            }
            self.queryResultToTable(result)

        })


    }

    self.queryResultToTable = function (result) {
        var data = result.results.bindings;
        //prepare columns
        var nonNullCols = {};
        data.forEach(function (item) {
            result.head.vars.forEach(function (varName) {
                if (varName.length < 3) {
                    return;
                }
                if (nonNullCols[varName]) {
                    return;
                }

                if (item[varName]) {
                    if (item[varName].type != "uri") {
                        nonNullCols[varName] = item[varName].type;
                    }
                }
            });
        });
        var tableCols = [];
        var colNames = [];
        tableCols.push({title: "rowIndex", visible: false, defaultContent: "", width: "15%"});
        // colNames.push("rowIndex");
        for (var varName in nonNullCols) {
            tableCols.push({title: varName, defaultContent: "", width: "15%"});
            colNames.push(varName);
        }

        var tableData = [];
        self.currentData = data;
        self.tableCols = tableCols;
        data.forEach(function (item, index) {
            var line = [index];
            colNames.forEach(function (col) {
                var value = null;
                if (item[col]) {
                    value = item[col].value;

                    //format date
                    if (item[col].datatype == "http://www.w3.org/2001/XMLSchema#dateTime") {
                        var p = value.indexOf("T00:00:00.000Z");
                        if (p > -1) {
                            value = value.substring(0, p);
                        }
                    }
                }

                line.push(value);
            });

            tableData.push(line);
        });


        Export.showDataTable(null, tableCols, tableData, null, {
            paging: true,
            divId: self.datatableDivId
        }, function (err, datatable) {
            Lifex_cost_charts.DataTable=datatable;
            self.underlineJCDatTableChanges();
            

            
          
            $("#dataTableDivExport").on("click", "td", function () {
                
                var table = $("#dataTableDivExport").DataTable();
                var index = table.cell(this).index();
                var row = table.row(this).data();
                var column = table.cell(this).column().data();
                var jobCardLabel = table.cell(this).data();

                Lifex_cost_JobCardController.fillDetailsForm(jobCardLabel);
                /*
                var uri=null;
                self.currentData.forEach(function(item){
                    if(item["JobCard_label"]&&  item["JobCard_label"].value==jobCardLabel){
                       uri=item["JobCard"].value
                    }
                })
                if( uri)
                    Lifex_cost_JobCardController.fillDetailsForm(uri);

                var datasetIndex = column[index.row];
                var dataItem = self.currentData[datasetIndex];
                var varName = self.tableCols[index.column].title;
                var uri = dataItem[varName].value;*/


            });
        });
    };


    self.fillDetailsForm = function (jobcardlabel, mode) {
        if(!jobcardlabel.toLowerCase().includes('dal')){
            return;
        }
        self.currentInputValues = {}
        self.prefixMap = {prefix: "cost", uri: Config.sources["DALIA_LIFEX_COSTS"].graphUri}
        $("#smallDialogDiv").load("/plugins/Lifex_cost/html/jobCardDetails2.html", function () {
            $("#smallDialogDiv").dialog("open")
            $("#smallDialogDiv").dialog("option","title",jobcardlabel)
            var filter = Sparql_common.setFilter("JobCard", null, jobcardlabel, {labelSuffix: "_label"})
            Lifex_cost_JobCardController.getJobcardPhasesMap(filter, {}, function (err, dataMap) {
                self.currrentDataMap = dataMap
                if (err) {
                    return alert(err)
                }
                var inputVarNames = ["startDate", "endDate", "phaseCost"]
                var html = "<tr><td>Phase</td>";

                inputVarNames.forEach(function (varName) {
                    html += "<td>" + varName + "</td>";
                })
                html += "</tr>"

                for (var key in dataMap) {
                    html += "<tr><td>" + key + "</td>"
                    var data = dataMap[key].data[0]
                    inputVarNames.forEach(function (varName) {
                        var inputId = "jc_" + common.getRandomHexaId(4);
                        var formattedValue = self.formatValue(data[varName], inputId)
                        var value = data[varName] ? data[varName].value : "";
                        var property = self.prefixMap.prefix + ":" + varName
                        var datatype = data[varName] ? data[varName].datatype : null;
                        if (!datatype &&  property.indexOf("Date") > -1){
                            datatype="http://www.w3.org/2001/XMLSchema#dateTime"
                        }


                        self.currentInputValues[inputId] = {
                            subject: data.phase.value,
                            property: property,
                            value: value,
                            datatype: datatype,
                            formattedValue: formattedValue
                        }

                        html += "<td><input id='" + inputId + "' value='" + formattedValue + "'></td>"


                    })
                    html += "</tr>"


                }

                $("#jobcardPhasesDiv").html(html)
                setTimeout(function () {
                    for (var inputId in self.currentInputValues) {

                        var obj = self.currentInputValues[inputId];
                        if (obj.datatype == "http://www.w3.org/2001/XMLSchema#dateTime" ) {
                            var date = new Date(obj.value)
                            $("#" + inputId).datepicker({
                                changeMonth: true,
                                changeYear: true,
                                dateFormat: "yy-mm-dd",
                                onSelect:function(dateTxt,inst){
                                    var endDateTd=$('#'+inst.id).parent().parent().children()[2];
                                    var endDateVal=$(endDateTd).find('input').val();
                                    if(endDateVal){
                                        var lastStartDate=new Date(inst.lastVal);
                                        var endDate=new Date(endDateVal)
                                        var durationDays=(endDate-lastStartDate)/(1000 * 60 * 60 * 24);
                                        var newEndDate=new Date(dateTxt);
                                        newEndDate.setDate(newEndDate.getDate()+durationDays);

                                    }
                                    $(endDateTd).find('input').datepicker("setDate", newEndDate);
                                },

                                /*   showOn: "button",
                                   buttonImage: "images/calendar.gif",
                                   buttonImageOnly: true,
                                   buttonText: "Select date"*/
                            });
                            if (obj.value) {
                                var date = new Date(obj.value)

                                self.currentInputValues[inputId].time = date.getTime()
                                $("#" + inputId).datepicker("setDate", date)
                            }


                        }
                    }

                }, 200)


            })

        })
    }

    self.formatValue = function (resultItem, inputId) {
        if (!resultItem) {
            return "";
        }
        return resultItem.value;


        /*   if (resultItem.datatype == "http://www.w3.org/2001/XMLSchema#dateTime") {
               var date = new Date(resultItem.value)
               var str = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate()


               return str;


           } else {
               return resultItem.value
           }*/
    }


    self.getJobcardPhasesMap = function (filter, options, callback) {

       self.phasesMap = {
            Engineering: {type: "http://data.total/resource/tsf/dalia-lifex-costs/EngineeringPhase"},
            Procurement: {type: "http://data.total/resource/tsf/dalia-lifex-costs/ProcurementPhase"},
            Prefabrication: {type: "http://data.total/resource/tsf/dalia-lifex-costs/PrefabricationPhase"},
            OffshoreConstruction: {type: "http://data.total/resource/tsf/dalia-lifex-costs/OffshoreConstructionPhase"},

        }

        async.eachSeries(Object.keys(self.phasesMap), function (phase, callbackEach) {
            Lifex_cost_SparqlQueries.executeJobcardPhaseInfosQuery(self.phasesMap[phase].type, {filter:filter}, function (err, result) {

                if (err) {
                    return callbackEach(err)
                }


                self.phasesMap[phase].data = result.results.bindings
                return callbackEach()


            });
        }, function (err) {
            return callback(err, self.phasesMap)
        })
    }


    self.saveDetailsForm = function () {
        var triplesToDelete = []
        var triplesToWrite = []
        for (var inputId in self.currentInputValues) {
            var obj = self.currentInputValues[inputId]
            var oldValue = obj.value
            var newValue = $("#" + inputId).val()
            var oldTime = obj.time
            var newTime = null;

            var ok = false

            if (obj.datatype == "http://www.w3.org/2001/XMLSchema#dateTime") {

                var date = $("#" + inputId).datepicker("getDate")
                if(date) {

                    newTime = date.getTime()
                    //newValue = "\"" + date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + "\"^^xsd:date"
                    newValue = Sparql_common.getSparqlDate(date)
                    if (oldTime) {
                        var oldDate = new Date(oldTime)
                        oldValue = Sparql_common.getSparqlDate(oldDate);
                        //"\"" + oldDate.getFullYear() + "/" + (oldDate.getMonth() + 1) + "/" + oldDate.getDate() + "\"^^xsd:date"
                    }

                    ok = newTime != oldTime
                }
                else{
                    ok=false;
                }




            } else if (obj.datatype == "http://www.w3.org/2001/XMLSchema#int") {
                ok = newValue != oldValue
                newValue = "\"" + newValue + "\"¨^^xsd:int"
            } else if (obj.datatype == "http://www.w3.org/2001/XMLSchema#float") {
                ok = newValue != oldValue
                newValue = "\"" + newValue + "\"^^xsd:float"
            } else {
                ok = newValue != oldValue
                if (newValue.indexOf("http") == 0) {
                    newValue = "<" + newValue + ">"
                } else {
                    newValue = "\"" + newValue + "\""
                }
            }

            if (ok) {

                if(oldValue) {
                    triplesToDelete.push({
                        subject: "<" + obj.subject + ">",
                        predicate: obj.property,
                        object: oldValue
                    })
                }


                triplesToWrite.push({
                    subject: "<" + obj.subject + ">",
                    predicate: obj.property,
                    object: newValue
                })


            }
        }

        var x = triplesToWrite;
        var y = triplesToDelete


        if (triplesToWrite.length == 0) {
            return $("#smallDialogDiv").dialog("close")
        }
        var graphUri = Config.sources[Lifex_cost.currentSource].graphUri
        Lifex_cost_SparqlQueries.writeModifiedTriples(graphUri, triplesToDelete, triplesToWrite, {history: true}, function (err, result) {
            if (err) {
                return alert(err)
            }
            UI.message("modifications saved : " + triplesToWrite.length + " values")
            $("#smallDialogDiv").dialog("close")
        })

    }
    self.jobCardOnSelectedDate=function(date,group){
        if(!Lifex_cost_charts.currentDateDistribution){
            return;
        }if(group=='global' || group=='NoGroup' ){
            group=null;
        }
        var splitVar=$('#Lifex_cost_SplitBySelect').val()
        if(splitVar=='Cost Type'){
            group=null;
        }
        $("#Lifex_cost_left_tabs").tabs("option", "active", 1);
        var date_key;
        if(!Lifex_cost_charts.isDailyDistribution){
            var year=date.replace('-01-01','');
            date_key=year;
            if(year=='2020'){
                date_key='noYear';
            }

        }else{
            date_key=date.getTime();
        }
        var dateItems=Lifex_cost_charts.currentDateDistribution[date_key];

        if(!Lifex_cost_charts.isDailyDistribution){
            // clear all hightlight cells
            if(year=='2020'){
                year='noYear';
            }
            if(group=='NoGroup'){
                group=$('#Lifex_cost_quantityVarSelect').val();
            }
            Lifex_cost_charts.DataTable.cells().nodes().to$().css('background-color', '');
            Lifex_cost_charts.DataTable.rows().nodes().to$().css('background-color', '');
            var columnHTML;
            Lifex_cost_charts.DataTable.rows().every(function() {
                var data = this.data(); 
        
                if (data[0] === year) { 
                    $(this.node()).css('background-color', 'yellow'); 
                    columnHTML=$(this.node());
                }
            });
            var headers = Lifex_cost_charts.DataTable.columns().header();
            var indexOfColumn;
            $(headers).each(function(index, header) {
                var headerText = $(header).text();
                if(headerText==group){
                    indexOfColumn=index;
                }
            });
            if(indexOfColumn && columnHTML){
                $(columnHTML.children()[indexOfColumn]).css('background-color', 'red'); 
            }
           
        }


        // delete 0 values of the items
        self.cleanDateItems(dateItems);
        var str=`<span style='font-weight:bold'>Selected JobCard List At ${Lifex_cost_charts.isDailyDistribution ? common.dateToRDFString(date) : date.replace('-01-01','')} </span>`; 
        str += "<table class='infosTable cell-border' style='margin-top:20px;'>";
        str+="<thead><tr class='infos_table'>";
        str +=
            "<th class='detailsCellName' style='padding: 4px 4px'>" +
            'JobCardLabel'+
            "</th>";
        str +=
        "<th class='detailsCellName' style='padding: 4px 4px'>" +
        'Group'+
        "</th>";
        str +=
        "<th class='detailsCellName' style='padding: 4px 4px'>" +
        'Value'+
        "</th>";
        var yAxis=$('#Lifex_cost_quantityVarSelect').val();
        if(yAxis=='CAPEX'){
            str +=
            "<th class='detailsCellName' style='padding: 4px 4px'>" +
            'Capex'+
            "</th>";
        }
        str+='</tr></thead><tbody>';
        var dateItemOrdered=[]
        Object.keys(dateItems).forEach(function(jobCard){
            
            for (var key in dateItems[jobCard]){   
                if(group && group!=key){

                }else{
                    dateItemOrdered.push({jobCard:jobCard,group:key,value: dateItems[jobCard][key].value,capex:dateItems[jobCard][key].capex})
                }
            }
            
        });
        dateItemOrdered=dateItemOrdered.sort((a, b) => b.value - a.value);
        dateItemOrdered.forEach(function(item){
            str+="<tr class='infos_table'>"
            str += "<td class='detailsCellName' style='padding: 1px 1px;text-decoration: underline;' onclick='Lifex_cost_JobCardController.fillDetailsForm($(this).html())'>" +
            item.jobCard
            +"</td>";
            str += "<td class='detailsCellName' style='padding: 1px 1px'>" +
            item.group
            +"</td>";
            str += "<td class='detailsCellName' style='padding: 1px 1px'>" +
            item.value.toFixed(2)
            +"</td>";
            if(item.capex){
                str += "<td class='detailsCellName' style='padding: 1px 1px'>" +
                item.capex.toFixed(2)
                +"</td>";
            }
            str+="</tr>";
        });
       
        str+='</tbody></table>'


        $('#Lifex_cost_InfosTab').html(str);
        
        
    }
    self.cleanDateItems=function(dateItems){
        for(var jc in dateItems){
            for(var discipline in dateItems[jc]){
                if(dateItems[jc][discipline].capex){
                    if(dateItems[jc][discipline].value+dateItems[jc][discipline].capex==0){
                        delete dateItems[jc][discipline];
                    }
                }else{
                    if(dateItems[jc][discipline].value==0){
                        delete dateItems[jc][discipline];
                    }
                }
                
            }
            if(Object.values( dateItems[jc]).length==0){
                delete dateItems[jc];
            }
            
        }
    }
    self.onCapexSplitBySelect=function(){
        if($('#Lifex_cost_SplitBySelect').val()=='Cost Type'){
            $('#Lifex_cost_quantityVarSelect').val('CAPEX');
        }
        return;

    }
    self.allJCInfos=function(){
        var allJCInfos={};
        var JCvarsInfos;
        var JCphasesinfos;
        async.series([
            // Get Yearly distribution by Jobcard
            function (callbackSeries) {
                var valueVarName = $("#Lifex_cost_quantityVarSelect").val()


                if(["offshoreManHours" ,"POB"].indexOf(valueVarName)>-1){
                return   Lifex_cost_DailyDistribution.listJobCardsDailyDistribution()
                }


                var splitbyVarName = $("#Lifex_cost_SplitBySelect").val()
                if (splitbyVarName) {
                    splitbyVarName = Lifex_cost_JobCardController.splitByVarNamesMap[splitbyVarName].varName
                }
                
                var filter = Lifex_cost_FiltersWidget.getFilter({addJobCard:true});
                var options = {subQueries: filter.subQueries}
                $("#Lifex_cost_right_tabs").tabs("option", "active", 0);
            
                Lifex_cost_YearlyDistribution.getPropertyLifex_cost_YearlyDistribution(valueVarName, splitbyVarName, filter, options, function (err, jobcardYearsmap) {
                    allJCInfos=jobcardYearsmap;
                    callbackSeries();
                });
            },
            // Get JobCards properties related infos
            function(callbackSeries){
                var filter=`
                ?Discipline <http://rds.posccaesar.org/ontology/lis14/rdl/realizedIn> ?JobCard.
                 ?Discipline rdfs:label ?Discipline_label.
                
                `;
                Lifex_cost_SparqlQueries.executeJobcardListQuery(filter,{},function(err,result){

                    JCvarsInfos=result.results.bindings;
                    callbackSeries();
                });
            },
            // Get JobCard phases related infos
            function(callbackSeries){
                Lifex_cost_SparqlQueries.executeJobcardPhaseInfosQuery(null,{}, function (err, result) {
                    JCphasesinfos=result.results.bindings;
                    callbackSeries();
                });
            },
            //Calculate allInfos Object
            function(callbackSeries){
                var filtered_JCvarsInfos;
                var filtered_JCphasesinfos;
                for(let group in allJCInfos){
                    for (var jobCard in allJCInfos[group]){
                        // add JC variables infos
                        filtered_JCvarsInfos=JCvarsInfos.filter(function(item){return item.JobCard_label.value==jobCard });
                        allJCInfos[group][jobCard].discipline=filtered_JCvarsInfos[0].Discipline_label.value;
                        allJCInfos[group][jobCard].JobCard_CAPEX=filtered_JCvarsInfos[0]?.JobCard_CAPEX?.value;
                        allJCInfos[group][jobCard].JobCard_CPYcosts=filtered_JCvarsInfos[0]?.JobCard_CPYcosts?.value;
                        allJCInfos[group][jobCard].JobCard_contingenciesCost=filtered_JCvarsInfos[0]?.JobCard_contingenciesCost?.value;
                        filtered_JCphasesinfos=JCphasesinfos.filter(function(item){return item.JobCard_label.value==jobCard });
                        var phaseItem;
                        filtered_JCphasesinfos.forEach(function(phaseResult){
                            phaseItem={};
                            phaseItem.endDate=phaseResult?.endDate?.value;
                            phaseItem.startDate=phaseResult?.startDate?.value;
                            phaseItem.phaseCost=phaseResult?.phaseCost?.value;
                            if(phaseResult.OffshoreConstructionPhase_POB){
                                phaseItem.OffshoreConstructionPhase_POB=phaseResult.OffshoreConstructionPhase_POB.value;
                            }
                            if(phaseResult.OffshoreConstructionPhase_OffshoreManHours){
                                phaseItem.OffshoreConstructionPhase_OffshoreManHours=phaseResult.OffshoreConstructionPhase_OffshoreManHours.value;
                            }
                            allJCInfos[group][jobCard][phaseResult.phaseType_label.value]=phaseItem;
                        });
                    }
                }
                callbackSeries();
            }
            ]
            // Draw chart 
            , function (err) {
                if(err){
                    return callback(err)
                }
                var columns = [{title: "Group", defaultContent: ""},
                    {title: "Jobcard", defaultContent: ""},
                    {title: "Total", defaultContent: ""},
                    {title: "NA", defaultContent: ""},

                    {title: "Discipline", defaultContent: ""},

                    {title: "JobCard_Capex", defaultContent: ""},
                    {title: "JobCard_CPYcosts", defaultContent: ""},
                    {title: "JobCard_contingenciesCost", defaultContent: ""},

                    {title: "OffshoreConstructionPhase_startDate", defaultContent: ""},
                    {title: "OffshoreConstructionPhase_endDate", defaultContent: ""},
                    {title: "OffshoreConstructionPhase_phaseCost", defaultContent: ""},
                    {title: "OffshoreConstructionPhase_POB", defaultContent: ""},
                    {title: "OffshoreConstructionPhase_ofshoreManHours", defaultContent: ""},
                    
                    {title: "EngineeringPhase_startDate", defaultContent: ""},
                    {title: "EngineeringPhase_endDate", defaultContent: ""},
                    {title: "EngineeringPhase_phaseCost", defaultContent: ""},
                    
                    {title: "PrefabricationPhase_startDate", defaultContent: ""},
                    {title: "PrefabricationPhase_endDate", defaultContent: ""},
                    {title: "PrefabricationPhase_phaseCost", defaultContent: ""},

                    
                    {title: "ProcurementPhase_startDate", defaultContent: ""},
                    {title: "ProcurementPhase_endDate", defaultContent: ""},
                    {title: "ProcurementPhase_phaseCost", defaultContent: ""},
                ]

                var yearKeys = []
                for (var year = 2020; year < 2046; year++) {
                    columns.push({title: "" + year, defaultContent: ""});
                    yearKeys.push("" + year)
                }
                var data = []
                for (var group in allJCInfos) {

                    for (var jobCard in allJCInfos[group]) {
                        var total = 0
                        var obj = [group, jobCard];
                        
                        obj.push(allJCInfos[group][jobCard].totalValue?.toFixed(2) || "");
                        obj.push(allJCInfos[group][jobCard]?.noYear?.value?.toFixed(2) || "");

                        obj.push(allJCInfos[group][jobCard].discipline);

                        obj.push(allJCInfos[group][jobCard].JobCard_CAPEX);
                        obj.push(allJCInfos[group][jobCard].JobCard_CPYcosts);
                        obj.push(allJCInfos[group][jobCard].JobCard_contingenciesCost);
                        
                        obj.push(allJCInfos[group][jobCard].OffshoreConstructionPhase.startDate?.split('T')[0]);
                        obj.push(allJCInfos[group][jobCard].OffshoreConstructionPhase.endDate?.split('T')[0]);
                        obj.push(allJCInfos[group][jobCard].OffshoreConstructionPhase.phaseCost);
                        obj.push(allJCInfos[group][jobCard].OffshoreConstructionPhase.OffshoreConstructionPhase_POB);
                        obj.push(allJCInfos[group][jobCard].OffshoreConstructionPhase.OffshoreConstructionPhase_OffshoreManHours);

                        obj.push(allJCInfos[group][jobCard].EngineeringPhase.startDate?.split('T')[0]);
                        obj.push(allJCInfos[group][jobCard].EngineeringPhase.endDate?.split('T')[0]);
                        obj.push(allJCInfos[group][jobCard].EngineeringPhase.phaseCost);
                       
                        obj.push(allJCInfos[group][jobCard].PrefabricationPhase.startDate?.split('T')[0]);
                        obj.push(allJCInfos[group][jobCard].PrefabricationPhase.endDate?.split('T')[0]);
                        obj.push(allJCInfos[group][jobCard].PrefabricationPhase.phaseCost);
                       
                        obj.push(allJCInfos[group][jobCard].ProcurementPhase.startDate?.split('T')[0]);
                        obj.push(allJCInfos[group][jobCard].ProcurementPhase.endDate?.split('T')[0]);
                        obj.push(allJCInfos[group][jobCard].ProcurementPhase.phaseCost);
                       
                        yearKeys.forEach(function (year) {
                            var value = null;
                            if (allJCInfos[group][jobCard][year]) {
                                value = allJCInfos[group][jobCard][year].value
                                if (allJCInfos[group][jobCard][year].capex) {
                                    value += allJCInfos[group][jobCard][year].capex
                                }

                                obj.push(value.toFixed(2) || "")
                            } else {
                                obj.push("");
                            }
                           
                        });
                        
                        data.push(obj)
                    }
                }
                Lifex_cost_FiltersWidget.setTitle(null,true);
                Export.showDataTable(null, columns, data, null, {
                    paging: true,
                    divId: Lifex_cost_JobCardController.datatableDivId
                }, function (err, datatable) {
                    Lifex_cost_charts.DataTable=datatable;
                    self.underlineJCDatTableChanges();
                    $("#dataTableDivExport").on("click", "td", function () {

                        var table = $("#dataTableDivExport").DataTable();
                        var index = table.cell(this).index();
                        var row = table.row(this).data();
                        var column = table.cell(this).column().data();
                        var jobCardLabel = table.cell(this).data();

                        Lifex_cost_JobCardController.fillDetailsForm(jobCardLabel);

                    })
                })
            
                
            

            });
    }
    self.underlineJCDatTableChanges=function(){
            var headers = Lifex_cost_charts.DataTable.columns().header();
            var indexOfColumn;
            $(headers).each(function(index, header) {
                var headerText = $(header).text();
                if(headerText=='JobCard' || headerText=='JobCard_label' || headerText=='Jobcard' ){
                    indexOfColumn=index;
                }
            });
            var columnHTML = Lifex_cost_charts.DataTable.column(indexOfColumn).nodes();
            $(columnHTML).each(function(){
                $(this).css('text-decoration', 'underline');
            });
    }

    return self;


})()

export default Lifex_cost_JobCardController
window.Lifex_cost_JobCardController = Lifex_cost_JobCardController

