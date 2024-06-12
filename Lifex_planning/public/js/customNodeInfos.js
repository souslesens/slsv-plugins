

var CustomNodeInfos = (function() {
    var self = {};
    self.nodeInfosRelatedTags={};

    self.generateRawInfosStr=function(prop,value,notTr){
        var str="<tr class='infos_table'>";
        str +=
        "<td class='detailsCellName'>" +
        prop+
        "</td>";
    str +=
        "<td class='detailsCellValue'><div class='content'>" +
        value
        +
        "</div></td>";
        if(notTr){

        }else{
            str+="</tr>"
        }
        
        return(str);
    }
    self.TasksTabDiv=function(){
        //Tasks
         
        var str = "<div class='NodesInfos_tableDiv'style='display:inline-grid;max-height:74vh;width:800px;'>" + "<table class='infosTable'>";
        
        str+="<thead><tr class='infos_table'>";
        str +=
        "<th class='detailsCellName' style='width:20px;'>" +
        'Task Sequence'+
        "</th>";
        str +="<th class='detailsCellName'>" +
        'Task'+
        "</th></thead>";
        var query=`
            PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
            Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  where 
            {<${self.linked_JobCard.uri}> ^<http://rds.posccaesar.org/ontology/lis14/rdl/activityPartOf> ?Task.

            ?Task  rdf:type <http://data.total/resource/tsf/dalia-lifex1/Task>.
        OPTIONAL  {?Task <http://www.w3.org/2000/01/rdf-schema#label> ?Task_label.}
        OPTIONAL  {?Task <http://data.total/resource/tsf/dalia-lifex1/sequenceNumber> ?Task_sequenceNumber.}
        }  
        `;
        Sparql_proxy.querySPARQL_GET_proxy(self.url, query, "", { source: Lifex_planning.currentSource }, function (err, result) {
            var tasksStr='';
            result.results.bindings.forEach((row,index)=>{
                var style='';
                str+="<tr class='infos_table'>";
                str += "<td class='detailsCellValue' style='width:20px;'>" +
                row.Task_sequenceNumber.value
                +"</td>";
                str += "<td class='detailsCellValue'><div class='content'>" +
                row.Task_label.value
                +"</div></td>";
                str+="</tr>";
                
            });
            //tasksStr=tasksStr.slice(0, -1);
           
            str+="</tbody><table>";
            str+="</div>";
            $("#nodeInfosWidget_ObjectDiv").html(str);
        });


            
       
    };
    self.TagsTabDiv=function(isEquipement){
        var strTagTable='';
        var tagsResults={};
        //Tags
        async.series([
               //Tags
                function(callbackSeries) {
                    
                    strTagTable= "<div class='NodesInfos_tableDiv'style='display:inline-grid;max-height:74vh;width:900px;'> <table class='infosTable' style='margin-top:20px;'>";
                    strTagTable+="<thead><tr class='infos_table'>";
                    strTagTable +=
                    "<th class='detailsCellName'>" +
                    'TagLabel'+
                    "</th>";
                    
                    strTagTable +=
                    "<th class='detailsCellName'>" +
                    'Tag Title'
                    +
                    "</th>";
                    if(!isEquipement){
                        strTagTable +=
                        "<th class='detailsCellName'>" +
                        'Package'
                        +
                        "</th>";
                        strTagTable +=
                        "<th class='detailsCellName'>" +
                        'Functional Location'
                        +
                        "</th>"; 
                    }
                    if(isEquipement){
                        strTagTable +=
                        "<th class='detailsCellName'>" +
                        'Equipement Label'
                        +
                        "</th>";
                        strTagTable +=
                        "<th class='detailsCellName'>" +
                        'Equipement Cost'
                        +
                        "</th>";
                        strTagTable +=
                        "<th class='detailsCellName'>" +
                        'Equipement Weight'
                        +
                        "</th>";
                    }
                    strTagTable +="</thead></tr>";
                    var query=`
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
                    Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  where 
                    {<${self.linked_JobCard.uri}> <http://rds.posccaesar.org/ontology/lis14/rdl/hasPassiveParticipant> ?tag.

                    ?tag  rdf:type <http://data.total/resource/tsf/dalia-lifex1/tag>.
                    OPTIONAL  {?tag <http://www.w3.org/2000/01/rdf-schema#label> ?tag_label.}
                     OPTIONAL  {?tag <http://purl.org/dc/terms/title> ?tag_title.}
                    }  
                    `;
                Sparql_proxy.querySPARQL_GET_proxy(self.url, query, "", { source: Lifex_planning.currentSource }, function (err, result) {
                 
                    result.results.bindings.forEach((row,index)=>{
                      
                        self.nodeInfosRelatedTags[row.tag.value]={'label':row.tag_label.value};
                        self.nodeInfosRelatedTags[row.tag.value]['title']=row.tag_title.value;
                    });
                   
                    callbackSeries();
                });


            
            },
            //Packages and tag titles
            function(callbackSeries) {
                if(isEquipement){
                    return callbackSeries();
                }
                var tagsUri=Object.keys(CustomNodeInfos.nodeInfosRelatedTags);
                var tagUriStr=tagsUri.map(item => `<${item}>`).join(',');
                var query=`PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  where {?tag <http://rds.posccaesar.org/ontology/lis14/rdl/locatedRelativeTo> ?Package.


                ?tag  rdf:type <http://data.total/resource/tsf/dalia-lifex1/tag>.  ?Package  rdf:type <http://data.total/resource/tsf/dalia-lifex1/Package>.
                FILTER(?tag in (${tagUriStr})).
                OPTIONAL  {?tag <http://www.w3.org/2000/01/rdf-schema#label> ?tag_label.}
               
                OPTIONAL  {?Package <http://www.w3.org/2000/01/rdf-schema#label> ?Package_label.}
            }  `;
            Sparql_proxy.querySPARQL_GET_proxy(self.url, query, "", { source: Lifex_planning.currentSource }, function (err, result) {
            
                result.results.bindings.forEach((row,index)=>{
                    
                    self.nodeInfosRelatedTags[row.tag.value]['package']=row.Package_label.value;
                });
                callbackSeries();
            });
            },
            //FL
            function(callbackSeries) {
                if(isEquipement){
                    return callbackSeries();
                }
                var tagsUri=Object.keys(CustomNodeInfos.nodeInfosRelatedTags);
                var tagUriStr=tagsUri.map(item => `<${item}>`).join(',');
                var query=`PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  where 
                {?tag <http://rds.posccaesar.org/ontology/lis14/rdl/residesIn> ?FunctionalLocation.


                ?tag  rdf:type <http://data.total/resource/tsf/dalia-lifex1/tag>.  ?FunctionalLocation  rdf:type <http://data.total/resource/tsf/dalia-lifex1/FunctionalLocation>.
                FILTER(?tag in (${tagUriStr})).
                OPTIONAL  {?tag <http://www.w3.org/2000/01/rdf-schema#label> ?tag_label.}
                OPTIONAL  {?tag <http://purl.org/dc/terms/title> ?tag_title.}
                OPTIONAL  {?FunctionalLocation <http://www.w3.org/2000/01/rdf-schema#label> ?FunctionalLocation_label.}
            }  `;
            Sparql_proxy.querySPARQL_GET_proxy(self.url, query, "", { source: Lifex_planning.currentSource }, function (err, result) {
               
                    result.results.bindings.forEach((row,index)=>{
                        self.nodeInfosRelatedTags[row.tag.value]['fLLabel']=row.FunctionalLocation_label.value;
                        
                    });
                   
                    callbackSeries();
                });

                
                    
            },
            //Equipements
            function(callbackSeries){
                if(!isEquipement){
                    return callbackSeries();
                }
                var tagsUri=Object.keys(CustomNodeInfos.nodeInfosRelatedTags);
                var tagUriStr=tagsUri.map(item => `<${item}>`).join(',');
                var query=`PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
                Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  where 
                {?tag <http://rds.posccaesar.org/ontology/lis14/rdl/locatedRelativeTo> ?EquipmentItem.


                ?tag  rdf:type <http://data.total/resource/tsf/dalia-lifex1/tag>.  ?EquipmentItem  rdf:type <http://data.total/resource/tsf/dalia-lifex1/EquipmentItem>.
                FILTER(?tag in (${tagUriStr})).
                OPTIONAL  {?tag <http://www.w3.org/2000/01/rdf-schema#label> ?tag_label.}
              
                OPTIONAL  {?EquipmentItem <http://www.w3.org/2000/01/rdf-schema#label> ?EquipmentItem_label.}
                
                OPTIONAL  {?EquipmentItem <http://data.total/resource/tsf/dalia-lifex1/hasWeight> ?Weight.
                ?Weight <http://www.w3.org/1999/02/22-rdf-syntax-ns#value> ?Weight_value.}
                OPTIONAL  {
                ?Cost ^<http://data.total/resource/tsf/dalia-lifex1/hasCost> ?EquipmentItem.
                ?Cost <http://www.w3.org/1999/02/22-rdf-syntax-ns#value> ?Cost_value.}
                }   `;

            Sparql_proxy.querySPARQL_GET_proxy(self.url, query, "", { source: Lifex_planning.currentSource }, function (err, result) {
                result.results.bindings.forEach((row,index)=>{
                    var cost='';
                    var weight='';
                    if(row.Cost_value){
                        cost=row.Cost_value.value;
                    }
                    if(row.Weight_value){
                        weight=row.Weight_value.value;
                    }
                    var EquipmentItem={'label' : row.EquipmentItem_label.value,'Cost':cost,'Weight':weight};
                    if(!self.nodeInfosRelatedTags[row.tag.value]['Equipement']){
                        self.nodeInfosRelatedTags[row.tag.value]['Equipement']=[EquipmentItem];
                    }
                    else{
                        self.nodeInfosRelatedTags[row.tag.value]['Equipement'].push(EquipmentItem);
                    }
                    
                    
                    
                });
                    callbackSeries();
                });
            }
        
        ],
            function(err){
                
                for (let tag in self.nodeInfosRelatedTags) {
                    strTagTable+='<tr class="infos_table">'
                    strTagTable+='<td class="detailsCellValue"><div class="content">'+self.nodeInfosRelatedTags[tag].label+'</div></td>';
                    strTagTable+='<td class="detailsCellValue"><div class="content">'+self.nodeInfosRelatedTags[tag].title+'</div></td>';
                    if(!isEquipement){

                    
                        strTagTable+='<td class="detailsCellValue"><div class="content">'+self.nodeInfosRelatedTags[tag].package+'</div></td>';
                        strTagTable+='<td class="detailsCellValue"><div class="content">'+self.nodeInfosRelatedTags[tag].fLLabel+'</div></td>';
                    }
                    if(isEquipement){
                        if(self.nodeInfosRelatedTags[tag].Equipement){
                            var labelStr='';
                            var CostStr='';
                            var WeightStr='';
                            self.nodeInfosRelatedTags[tag].Equipement.forEach((equip,index)=>{
                                var style='height:25px;';
                                if(index!=self.nodeInfosRelatedTags[tag].Equipement.length-1){
                                    style+='border-bottom:#8757de solid 1px;';
                                }

                                labelStr+=`<div style="${style}" >`+equip.label+'</div>';
                                CostStr+=`<div style="${style}" >`+equip.Cost+'</div>';
                                WeightStr+=`<div style="${style}">`+equip.Weight+'</div>';
                                
                            });
                            strTagTable+='<td class="detailsCellValue">';
                            strTagTable+=labelStr;
                            strTagTable+='</td>';
                            strTagTable+='<td class="detailsCellValue">';
                            strTagTable+=CostStr;
                            strTagTable+='</td>';
                            strTagTable+='<td class="detailsCellValue">';
                            strTagTable+=WeightStr;
                            strTagTable+='</td>';
                                
                        }
                        else{
                            strTagTable+='<td class="detailsCellValue">'+''+'</td>';
                            strTagTable+='<td class="detailsCellValue">'+''+'</td>';
                            strTagTable+='<td class="detailsCellValue">'+''+'</td>';
                        }
                    }
                
                    strTagTable+='</tr>';
                    
                }

                strTagTable+="<table>";
                strTagTable+="</div>"
                $("#nodeInfosWidget_ObjectDiv").html(strTagTable);
               
                
            });
    }
    self.WBSJobCardTabDiv=function(uri,callback){
        if(!uri){
            return;
        }
        var label=uri.split('/')[uri.split('/').length-1];
        var str = "<div class='NodesInfos_tableDiv'style='display:inline-grid;max-height:74vh;width:800px;'>" + "<table class='infosTable'>";
            var sparql_url = Config.sources[Lifex_planning.currentSource].sparql_server.url;
            if ((sparql_url = "_default")) {
                sparql_url = Config.sparql_server.url;
            }
            var url = sparql_url + "?format=json&query=";
            self.url=url;
            self.linked_JobCard={};
            var strTagTable='';
            async.series([

                //get WBS properties and related JC with properties 
                function(callbackSeries) {
                    var query=`PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
                    Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/> 
                    FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  
                    FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  
                    where {<${uri}> <http://rds.posccaesar.org/ontology/lis14/rdl/occursRelativeTo> ?JobCardExecution.
                    OPTIONAL  {<${uri}> <http://www.w3.org/2000/01/rdf-schema#label> ?WBS_activity_label.}
                    OPTIONAL  {<${uri}> <http://purl.org/dc/terms/title> ?WBS_activity_title.}
                    OPTIONAL  {<${uri}> <http://data.total/resource/tsf/PRIMAVERA_TEST/startDate> ?WBS_activity_startDate.}
                    OPTIONAL  {<${uri}> <http://data.total/resource/tsf/PRIMAVERA_TEST/endDate> ?WBS_activity_endDate.}
                    OPTIONAL  {<${uri}> <http://data.total/resource/tsf/PRIMAVERA_TEST/durationInHours> ?WBS_activity_durationInHours.}
                    OPTIONAL  {?JobCardExecution <http://www.w3.org/2000/01/rdf-schema#label> ?JobCardExecution_label.}
                    OPTIONAL  {?JobCardExecution <http://purl.org/dc/terms/title> ?JobCardExecution_title.}
                    OPTIONAL  {?JobCardExecution <http://data.total/resource/tsf/dalia-lifex1/scafoldingVolume> ?JobCardExecution_scafoldingVolume.}
                    OPTIONAL  {?JobCardExecution <http://data.total/resource/tsf/dalia-lifex1/scafoldingComments> ?JobCardExecution_scafoldingComments.}
                    OPTIONAL  {?JobCardExecution <http://purl.org/dc/terms/description> ?JobCardExecution_description.}
                    }  `;
                    
                    Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: Lifex_planning.currentSource }, function (err, result) {
                        //console.log(result);
                        $("[aria-selected='true']").addClass("nodesInfos-selectedTab");
                        
                        
                        str +=
                            "<tr><td class='NodesInfos_CardId'>Label</td><td>"+
                            
                            label +
                            
                            "&nbsp;<button class='w3-button nodesInfos-iconsButtons ' style='font-size: 10px;margin-left:7px;' onclick=' NodeInfosWidget.copyUri(\"" +
                            label +
                            "\",$(this))'><input type='image' src='./icons/CommonIcons/CopyIcon.png' ></button>";
                        ("</td></tr>");
                    
                        str += "<tr><td>&nbsp;</td><td>&nbsp;</td></tr>";
                        
                        str +=self.generateRawInfosStr('WBS Activity Start Date',result.results.bindings[0].WBS_activity_startDate.value);
                        str +=self.generateRawInfosStr('WBS Activity End Date',result.results.bindings[0].WBS_activity_endDate.value);
                        str +=self.generateRawInfosStr('WBS Activity Duration (hours)',result.results.bindings[0].WBS_activity_durationInHours.value);
                        str +=self.generateRawInfosStr('WBS Activity title',result.results.bindings[0].WBS_activity_title.value);
                        
                        str += "</table>";
                        
                        self.linked_JobCard.uri=result.results.bindings[0].JobCardExecution.value;
                        self.linked_JobCard.label=result.results.bindings[0].JobCardExecution_label.value;
                        self.linked_JobCard.title=result.results.bindings[0].JobCardExecution_title.value;
                        self.linked_JobCard.scafoldingVolume=result.results.bindings[0].JobCardExecution_scafoldingVolume!=undefined ? result.results.bindings[0].JobCardExecution_scafoldingVolume.value : '';
                        self.linked_JobCard.scafoldingComments=result.results.bindings[0].JobCardExecution_scafoldingComments!=undefined ? result.results.bindings[0].JobCardExecution_scafoldingComments.value : '';
                        self.linked_JobCard.description=result.results.bindings[0].JobCardExecution_description.value;
                        
                        callbackSeries();



                        

                    });
                },
                
                // Discipline
                function(callbackSeries) {
                    
                    var query=`
                        PREFIX owl: <http://www.w3.org/2002/07/owl#>
                        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  
                        where {
                        <${self.linked_JobCard.uri}> ^<http://rds.posccaesar.org/ontology/lis14/rdl/realizedIn> ?Discipline.
                    
                    
                        ?Discipline  rdf:type <http://data.total/resource/tsf/dalia-lifex1/Discipline>.
                        OPTIONAL  {?Discipline <http://www.w3.org/2000/01/rdf-schema#label> ?Discipline_label.}
                        } 
                    `;
                    Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: Lifex_planning.currentSource }, function (err, result) {

                        str+="<table class='infosTable' style='margin-top:20px;'><tbody><tr><td class='NodesInfos_CardId'>Job Card</td></tr>";
                        str +=self.generateRawInfosStr('Discipline',result.results.bindings[0].Discipline_label.value);
                        str+=self.generateRawInfosStr('Job Card Label',self.linked_JobCard.label);
                        str+=self.generateRawInfosStr('Job Card title',self.linked_JobCard.title);
                        str+=self.generateRawInfosStr('Job Card description',self.linked_JobCard.description);
                        str+=self.generateRawInfosStr('Job Card Scafolding Volume',self.linked_JobCard.scafoldingVolume);
                        str+=self.generateRawInfosStr('Job Card Scafolding Comments',self.linked_JobCard.scafoldingComments);
                        callbackSeries();
                    });

                }
               
                

                

            ],

            function(err) {
                str+="</tbody><table>";
                str+="</div>";
                $("#nodeInfosWidget_InfosTabDiv").prepend(str);
                if(callback){
                    callback();
                }
                
                //$("#nodeInfosWidget_InfosTabDiv").html(str);
            }
        );
    }


    self.DocumentTabDiv=function(uri,callback){
        var str = "<div class='NodesInfos_tableDiv'style='display:inline-grid;max-height:74vh;width:800px;'>" + "<table class='infosTable'>";
    
        str+="<thead><tr class='infos_table'>";
        str +=
        "<th class='detailsCellName' style='width:20px;'>" +
        'Document'+
        "</th>";
        str +="<th class='detailsCellName'>" +
        'Document title'+
        "</th></thead>";
        async.series([

                //get WBS properties and related JC with properties 
                function(callbackSeries) {
                    
                    var query=`
                        PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
                        Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  where 
                        {<${self.linked_JobCard.uri}> ^<http://rds.posccaesar.org/ontology/lis14/rdl/isAbout> ?JC_Document.

                      <${self.linked_JobCard.uri}>  rdf:type <http://data.total/resource/tsf/dalia-lifex1/JobCardExecution>.   ?JC_Document rdf:type <http://data.total/resource/tsf/dalia-lifex1/JC_Document>.

                    OPTIONAL  {?JC_Document <http://www.w3.org/2000/01/rdf-schema#label> ?JC_Document_label.}
                    }  
                    `;
                    
                    Sparql_proxy.querySPARQL_GET_proxy(self.url, query, "", { source: Lifex_planning.currentSource }, function (err, result) {
                        var tasksStr='';
                        result.results.bindings.forEach((row,index)=>{
                            var style='';
                            var docUri=row.JC_Document.value;
                            str+="<tr class='infos_table'>";
                            str += "<td class='detailsCellValue' style='width:20px;'>" +
                            docUri.split('/')[docUri.split('/').length-1];
                            +"</td>";
                            str += "<td class='detailsCellValue'><div class='content'>" +
                            row.JC_Document_label.value
                            +"</div></td>";
                            str+="</tr>";
                            
                        });
                        //tasksStr=tasksStr.slice(0, -1);
                       
                       
                        
                        callbackSeries();



                        

                    });
                },
                
                
                function(callbackSeries) {
                    callbackSeries();
                   

                }
               
                

                

            ],

            function(err) {
                str+="</tbody><table>";
                str+="</div>";
                $("#nodeInfosWidget_ObjectDiv").html(str);
                if(callback){
                    callback();
                }
                
                //$("#nodeInfosWidget_InfosTabDiv").html(str);
            }
        );
    }
    self.showNodeInfos = function(uri) {
        //Test:    CustomNodeInfos.showNodeInfos('http://data.total/resource/tsf/dalia-lifex1/CNT-DAL-PVV-001422')
        
        self.nodeInfosRelatedTags={};
        var dialog = "mainDialogDiv";
        $("#" + dialog).dialog("open");
        var label=uri.split('/')[uri.split('/').length-1];
        $("#" + dialog).dialog("option", "title", "Infos : " +label);
        $(".nodeInfosWidget_tabDiv").css("margin", "0px");
        $("#" + dialog).parent().css('z-index',15);
        $("#" + dialog).load("/plugins/Lifex_planning/html/CustomNodeInfos.html", function () {
            $("#nodeInfosWidget_ObjectTabDiv").tabs({
                //  active: options.showAxioms ? 1 : 0,

                load: function (event, ui) {},
                activate: function (event, ui) {
                    $(".nodeInfosWidget_tabDiv").removeClass("nodesInfos-selectedTab");

                    setTimeout(function () {
                        $("[aria-selected='true']").addClass("nodesInfos-selectedTab");
                        if ($(ui.newTab).text()== "Infos") {
                            self.WBSJobCardTabDiv(uri);
                        }
                        if ($(ui.newTab).text()== "Tags") {
                            self.TagsTabDiv();
                        }
                        if ($(ui.newTab).text() == "Tasks") {
                            self.TasksTabDiv();
                        }
                        if ($(ui.newTab).text() == "Equipement") {
                            self.TagsTabDiv(true);
                        }
                        if ($(ui.newTab).text() == "Document") {
                            self.DocumentTabDiv();
                        }
                        
                    }, 100);
                },
                    
                
                
            });
            
            self.WBSJobCardTabDiv(uri,function(){
                self.TagsTabDiv();
            });
            
        
            
    });
  };

  return self;
})();

export default CustomNodeInfos;
window.CustomNodeInfos = CustomNodeInfos;