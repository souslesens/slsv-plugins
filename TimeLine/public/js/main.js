



var TimeLine = (function () {
    var self = {};
    self.source=null;
    self.datesTypes=null;
    self.inferredModel=null;
    self.timeline=null;
    self.onLoaded = function () {
        
    
        self.timelineSourceBrowser();

      
        
    };
    self.timelineSourceBrowser=function(){
        
        var options = {
            withCheckboxes: false,
        };
        var selectTreeNodeFn = function () {
            $("#mainDialogDiv").dialog("close");
            TimeLine.source = SourceSelectorWidget.getSelectedSource()[0];

            $('#graphDiv').load("/plugins/TimeLine/html/TimeLineDiv.html",function () { 
                
            });
            
                $('#toolPanelDiv').load("/plugins/TimeLine/html/leftPannelTimeLine.html",function () { 
                    TimeLine.getDatesTypes();
                });
            
            
        };
        SourceSelectorWidget.initWidget(["OWL"], "mainDialogDiv", true, selectTreeNodeFn, null, options);
    };

    self.getDatesTypes=function(callback){

        var sourceGraphUri=Config.sources[TimeLine.source].graphUri; 

        var query =`
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT distinct(?type) ?label FROM <${sourceGraphUri}> WHERE  {
            ?sub ?pred ?obj .
            ?sub rdf:type ?type.
            ?type rdfs:label ?label.
            filter(?pred != <http://purl.org/dc/terms/created>)
            filter(datatype(?obj) = xsd:dateTime).
            filter(?type not in (owl:NamedIndividual)).
        }limit 100
        `



    var url = Config.sources[TimeLine.source].sparql_server.url + "?format=json&query=";

    Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: TimeLine.source }, function (err, result) {
        if (err) {
            return callback(err);
        }
        if(callback){
            callback();
        }
        var data=[];
        var listIds=[];
        result.results.bindings.forEach(function (item, index) {
            
            data.push({ label: item.label.value, id: item.type.value,linkedBO: [] });
            listIds.push(item.type.value);
        });
        self.datesTypes=data;

        var result=[];
        async.series(
            [
                function (callbackSeries) {
                   
                    //  var _options = { withoutImports: Lineage_sources.activeSource || false };
                    KGqueryWidget.getInferredModelVisjsData(TimeLine.source, function (err, visjsData) {
                        if (err) {
                            callbackSeries();
                            return alert(err.responseText);
                            
                        }
                        self.inferredModel=visjsData;
                        var linkedObjects=[];
                        visjsData.edges.forEach(function (item, index) {
                            
                            if( listIds.includes(item.to)){
                                //self.datesTypes[item.to].linkedBO.push(item.from);
                                linkedObjects.push({id:item.from , label : visjsData.nodes.filter((word) => word.id==item.from)[0].label});
                            }

                            if( listIds.includes(item.from)){
                                //self.datesTypes[item.from].linkedBO.push(item.to);
                                linkedObjects.push({id:item.to , label: visjsData.nodes.filter((word) => word.id==item.to)[0].label });
                            }


                        });
                        linkedObjects=linkedObjects.filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i);
                        common.fillSelectOptions('BO',linkedObjects,true,"label","id");
                        callbackSeries();
                        
                    });
                  
                },
                
            ],
            function (err) {
                if (err) {
                    MainController.UI.message(err);
                   
                }
                
               
            });
      
       
        
    });

    };
    self.dateSelectedStartDate=function(){
        if($("#EndDates").val()!=''){
            self.dateSelected();
        }
    }
    self.dateSelected=function(){
        // verify the correct filling

        var startDateURI=$("#StartDates").val();
        var endDateURI=$("#EndDates").val();
        if(startDateURI==""){
            alert("Start Date required");
            return;
        }
        $("#AggregationDiv").load("/plugins/TimeLine/html/selectAggregation.html",function () { 
            // Fill GROUP BY and AXIS Y
            // To group By get BO selected then get all nodes with transitivity in inferred model trough it except himself and already items in bo div and fill them in select div 
            self.fillAggregationAndAxisDiv();

        })


        //Display others things Axis to sum

    }
    self.BOSelected=function(){
        $('#DatesDiv').load("/plugins/TimeLine/html/selectDates.html",function () { 
            common.fillSelectOptions('StartDates',self.datesTypes,true,"label","id");
            
            common.fillSelectOptions('EndDates',self.datesTypes,true,"label","id");       
        });
        
    };

    self.inferredModelToVicinityArray=function(inferredModel){
        var vicinityArray = [];
        inferredModel.edges.forEach(function (edge) {
            vicinityArray.push([edge.from, edge.to, edge.data.propertyId]);
        });
        return vicinityArray
    }
    self.fillAggregationAndAxisDiv=function(){
        

        var bo=$("#BO").val();
        var nodesToTest=JSON.parse(JSON.stringify(self.inferredModel.nodes));
        // excludes dates and current bo
        //nodesToTest
        var nodesToExclude=self.datesTypes.map(node=>node.id);

        nodesToExclude.push(bo);
        nodesToTest=nodesToTest.filter(node=>{
            return !nodesToExclude.includes(node.id);
        });
        var vicinityArray=self.inferredModelToVicinityArray(self.inferredModel);
        self.getLinkedObjectsFromNodeOnGraph(vicinityArray,bo,nodesToTest,function(err,result){
                var selectableTypesForAggregation=[];
                result.forEach(_result=>{
                    var itemNode=self.inferredModel.nodes.filter(node=>node.id==_result);
                    selectableTypesForAggregation.push({id:_result,label:itemNode[0].label});
                });

                common.fillSelectOptions('groupByDiv',selectableTypesForAggregation,true,"label","id");

                common.fillSelectOptions('ColorDiv',selectableTypesForAggregation,true,"label","id");
                var initialValue="";
                var reducedList=selectableTypesForAggregation.reduce((accumulator, currentValue) => accumulator +">,<" +currentValue.id,initialValue,);
                reducedList=reducedList.substring(2,reducedList.length);
                var query =`
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT distinct(?obj) ?label WHERE {
                    ?sub rdf:type ?obj.
                    ?obj rdfs:label ?label.
                    ?sub owl:hasValue ?litteralValue.
                filter(?obj in (${reducedList}>)).
                filter( isNumeric(?litteralValue)).
                } 
                
                `
            
            

            var url = Config.sources[self.source].sparql_server.url + "?format=json&query=";

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: self.source }, function (err, result) {
                if (err) {
                    return callback(err);
                }
                var numericalTypes=[];
                result.results.bindings.forEach(item=>{
                    numericalTypes.push({id:item.obj.value,label:item.label.value});
                });
                common.fillSelectOptions('axisYDiv',numericalTypes,true,"label","id");
            
            });

       
        
        });
    };

    self.getLinkedObjectsFromNodeOnGraph=function(vicinityArray,fromNodeId,nodesToCompare,callback){
        var result=[];
        nodesToCompare.forEach(function (node,index) {
            var toNodeId=node.id;
            
            var body = {
                fromNodeUri: fromNodeId,
                toNodeUri: toNodeId,
                vicinityArray: vicinityArray,
            };

            var payload = {
                body: body,
            };

            $.ajax({
                type: "POST",
                url: `${Config.apiUrl}/shortestPath`,
                data: payload,
                dataType: "json",
                success: function (data, _textStatus, _jqXHR) {
                    if(data.length>0){
                        result.push(toNodeId);
                    
                    }else{
                        console.log(toNodeId);
                    }
                    if(index==nodesToCompare.length-1){
                        return callback(null, result);
                    }
                    
                },
                error: function (err) {
                    return callback(err);
                },
            });
        });

    };
    self.shortestPathFromVicinityArray=function(fromNodeId,toNodeId,vicinityArray,callback){
        var body = {
            fromNodeUri: fromNodeId,
            toNodeUri: toNodeId,
            vicinityArray: vicinityArray,
        };

        var payload = {
            body: body,
        };

        $.ajax({
            type: "POST",
            url: `${Config.apiUrl}/shortestPath`,
            data: payload,
            dataType: "json",
            success: function (data, _textStatus, _jqXHR) {
               
                    return callback(null, data);
                
                
            },
            error: function (err) {
                return callback(err);
            },
        });
    }

    self.drawTimeLine=function(){

        
        var bo={id:$("#BO").val(),label:$("#BO option:selected").text()};
        var startDate={id:$("#StartDates").val(),label:$("#StartDates option:selected").text()};
        var endDate={id:$("#EndDates").val(),label:$("#EndDates option:selected").text()};
        var axisY={id:$("#axisYDiv").val(),label:$("#axisYDiv option:selected").text()};
        var groupBy={id:$("#groupByDiv").val(),label:$("#groupByDiv option:selected").text()};
        var color={id:$("#ColorDiv").val(),label:$("#ColorDiv option:selected").text()};

        // Construct querySet
        var elements=[];
        var vicinityArray=self.inferredModelToVicinityArray(self.inferredModel);
        async.series(
            [
                function (callbackSeries) {
                    //Start Date
                    var fromNode=startDate;
                    var toNode=bo;
                    self.shortestPathFromVicinityArray( fromNode.id, toNode.id,vicinityArray, function (err, result) {
                        if (err) {
                            callbackSeries(err);
                            return;
                        }
                        elements.push({fromNode:fromNode,fromNodeDivId:"",paths:result,toNode:toNode,toNodeDivId:""});
                        callbackSeries();
                    });
                },
                function (callbackSeries) {
                    
                    //End Date
                    var fromNode=bo;
                    var toNode=endDate;
                    if(endDate.id==''){
                        callbackSeries();
                        return;
                    }
                    self.shortestPathFromVicinityArray( fromNode.id, toNode.id,vicinityArray, function (err, result) {
                        if (err) {
                            callbackSeries(err);
                        }
                        elements.push({fromNode:fromNode,fromNodeDivId:"",paths:result,toNode:toNode,toNodeDivId:""});
                        callbackSeries();
                    });
                },
                function (callbackSeries) {
                    var fromNode=bo;
                    var toNode=axisY;
                    //Axis Y
                    if(axisY.id==''){
                        callbackSeries();
                        return;
                        
                    }
                    self.shortestPathFromVicinityArray( fromNode.id, toNode.id,vicinityArray, function (err, result) {
                        if (err) {
                            callbackSeries(err);
                        }
                        elements.push({fromNode:fromNode,fromNodeDivId:"",paths:result,toNode:toNode,toNodeDivId:""});
                        callbackSeries();
                    });
                },
                function (callbackSeries) {
                    var fromNode=bo;
                    var toNode=groupBy;
                    if(groupBy.id==''){
                        callbackSeries();
                        return;
                    }
                    //Group BY
                    self.shortestPathFromVicinityArray( fromNode.id, toNode.id,vicinityArray, function (err, result) {
                        if (err) {
                            callbackSeries(err);
                        }
                        elements.push({fromNode:fromNode,fromNodeDivId:"",paths:result,toNode:toNode,toNodeDivId:""});
                        callbackSeries();
                    });
                },
                function (callbackSeries) {
                    var fromNode=bo;
                    var toNode=color;
                    if(color.id==''){
                        callbackSeries();
                        return;
                    }
                    //Color
                    self.shortestPathFromVicinityArray( fromNode.id, toNode.id,vicinityArray, function (err, result) {
                        if (err) {
                            callbackSeries(err);
                            return;
                        }
                        elements.push({fromNode:fromNode,fromNodeDivId:"",paths:result,toNode:toNode,toNodeDivId:""});
                        callbackSeries();
                    });
                },
            
                
            ],
            function (err) {
                if (err) {
                    MainController.UI.message(err);
                
                }   
                //QUERY KG
                KGqueryWidget.querySets.sets=[];
                KGqueryWidget.querySets.sets.push({elements:elements,color:'green',booleanOperator:null,classFiltersMap:{}});
                KGqueryWidget.source=TimeLine.source;
                
                KGqueryWidget.execPathQuery(null,function(err,result){
                    // Treat Data and Dipslay TimeLine


                    if (err) {
                        return alert(err.responseText);
                    }
                    var groups = {};
                    var colors = {};
                    var timeBounds = { start: new Date("2000-01-01"), end: new Date("2100-01-01") };
                    /*
                    var bo={id:$("#BO").val(),label:$("#BO option:selected").text()};
                   
                    var axisY={id:$("#axisYDiv").val(),label:$("#axisYDiv option:selected").text()};
                    var groupBy={id:$("#groupByDiv").val(),label:$("#groupByDiv option:selected").text()};
                    var color={id:$("#ColorDiv").val(),label:$("#ColorDiv option:selected").text()};
                    */
                    var startDate={id:$("#StartDates").val(),label:$("#StartDates option:selected").text()};
                    var endDate={id:$("#EndDates").val(),label:$("#EndDates option:selected").text()};
                    result.results.bindings.forEach(function (item, index) {
                        var id = index;
                        var axisYData = item[self.transformVariableNameForQueryKG(axisY.label)+'Value']!=undefined ? item[self.transformVariableNameForQueryKG(axisY.label+'Value')].value : 20;
                        var groupByData = item[self.transformVariableNameForQueryKG(groupBy.label)].value ;
                        var strVariableBoLabel=self.transformVariableNameForQueryKG(bo.label)+'Label';
                        if(item[strVariableBoLabel]){
                            var boDataLabel = item[strVariableBoLabel].value;
                        }
                        
                        var boData = item[self.transformVariableNameForQueryKG(bo.label)].value;
                        if(!item[self.transformVariableNameForQueryKG(startDate.label)+'Value']){
                            return;
                        }
                        var _startDate = new Date(item[self.transformVariableNameForQueryKG(startDate.label)+'Value'].value.substring(0, 10));
                        
                        var _endDate = endDate.label!='' ? new Date(item[self.transformVariableNameForQueryKG(endDate.label)+'Value'].value.substring(0, 10)) : null;
                        var colorData= item[self.transformVariableNameForQueryKG(color.label)].value;
                        timeBounds.start = timeBounds.start < _startDate ? _startDate : timeBounds.start;
                        timeBounds.end = timeBounds.end > _endDate ? _endDate : timeBounds.end;
    
                        var groupKey = groupByData;
                        if (!groups[groupKey]) {
                            groups[groupKey] = [];
                        }
                        // replace by color gradient from most represented color to less
                        if(!colors[colorData]){
                            colors[colorData]="#"+Math.floor(Math.random()*16777215).toString(16);
                        }
                        var colorValue=colors[colorData];

                        
                        var boData_info=self.transformVariableNameForQueryKG(bo.label);
                        var boDataLabel_info=strVariableBoLabel;
                        var groupBy_info=self.transformVariableNameForQueryKG(groupBy.label);
                        
                        var data={};
                        if(self.transformVariableNameForQueryKG(axisY.label)!=''){
                            data[self.transformVariableNameForQueryKG(axisY.label)+'Value']=item[self.transformVariableNameForQueryKG(axisY.label)+'Value']!=undefined ? item[self.transformVariableNameForQueryKG(axisY.label+'Value')].value : 'default';
                        }
                        
                        data[boData_info]=boData;
                        if(boDataLabel!=undefined){
                            data[boDataLabel_info]= boDataLabel ;
                        }
                        
                        data[groupBy_info]=groupByData;

                        groups[groupKey].push({
                            id: "period_" + id,
                            // type: "box",
                            group: groupKey,
                            // content: axisYData,
                            title: boDataLabel!=undefined ?  boDataLabel + " POB" + axisYData :'',
                            editable:true,
                            start: _startDate,
                            end: _endDate,
                            editable: true,
                            data: data,
                            
                            style: "background-color:"+colorValue+";height:" + axisYData + "px",
                            visible: true,
                        });
                    });
    
                    var dataDataset = new vis.DataSet();
                    var groupsDataset = new vis.DataSet();
    
                    for (var key in groups) {
                        groupsDataset.add({
                            content: key,
                            id: key,
                        });
                        // groups[key]= self.setItemsColorClass( groups[key],"axisYData")
                        groups[key].forEach(function (item, index) {
                            dataDataset.add(item);
                        });
                    }
    
                    var groupsArray = [];
                    for (var key in groups) {
                        groupsArray.push({ id: key, label: key });
                    }
                    common.fillSelectOptions("timeLineWidget_groupSelect", groupsArray, false, "label", "id");
    
                    var x = dataDataset.get();
                    var container = document.getElementById("timeLineDiv");
    
                    if (timeBounds.start > timeBounds.end) {
                        var end = timeBounds.end;
                        timeBounds.end = timeBounds.start;
                        timeBounds.start = end;
                    }
    
                    var options = {
                        min: timeBounds.start, // lower limit of visible range
                        max: timeBounds.end,
                        height:"950px",
                        maxHeight: "950px",
                        margin: { item: { vertical: 1 } },
                        verticalScroll :true,
                        //  clickToUse:true,
                        // selectable:true
                    };
                    if(self.timeline!=null){
                        self.timeline.destroy();
                    }
                    var timeline = new vis.Timeline(container, dataDataset, groupsDataset, options);
                    self.timeline = timeline;
                    var firstChanged=false;
                    var callbackExecute=false;
                    if(!callback){
                        var callback=undefined;
                    }
                    timeline.on("changed",function(){
                        if(firstChanged){
                            if(callback!=undefined){
                                if(!callbackExecute){
                                    callback();
                                    callbackExecute=true;
                                }
                                
    
                            }
                        }
                        firstChanged=true;
                        
                        
        
                    });
                    timeline.on("click", function (properties) {
                        if (properties && properties.item) {
                            var item = self.timeline.itemsData.get(properties.item);
                            self.currrentTimelineItem = item;
                            var html = JSON.stringify(item.data) + " <button onclick='TimeLine.showInfos()'> Infos</button>";
                            $("#timeLineWidget_messageDiv").html(html);
                        } else {
                            self.currrentTimelineItem = null;
                        }
                    });





                    
                });
        });
  

        
        

    };


    self.transformVariableNameForQueryKG=function(str){
        if(str[0]==' '){
            str=str.slice(1,str.length-1);
        }
        if(str[str.length-1]==' '){
            str=str.slice(0,str.length-1);
        }
        return str.replaceAll(' ','_').replaceAll('-','_')
    }

    self.showInfos=function(){
       // get all item infos from Query KG and display it on a NodeInfo
       // We can also have node info of Business Object
    };
    self.filter=function(){

    };

    return self;
})();

export default TimeLine;
window.TimeLineWidget = TimeLine;
