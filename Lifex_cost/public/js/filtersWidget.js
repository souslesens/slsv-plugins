

import Lifex_cost_GroupsController from "./groupsController.js";
import Lifex_cost from "./main.js";
import Charts from "./charts.js";

var Lifex_cost_FiltersWidget = (function () {
    var self = {};
    self.jstreeDiv = "Lifex_cost_jstreeFilterDiv";
    self.idsMap = {};
    self.currentBotFilters=[];
    
    self.loadTree = function (source) {

        self.currentSource = source;

        var options = {
            openAll: false,
            withCheckboxes: true,
            keep_selected_style: false,
            checkbox : {
                "cascade" : "none"  
            },
            contextMenu: Lifex_cost_FiltersWidget.getContextJstreeMenu(),
            selectTreeNodeFn: Lifex_cost_FiltersWidget.onSelectedNodeTreeclick,
            onUncheckNodeFn:Lifex_cost_FiltersWidget.onUnCheckNode,
            onCheckNodeFn:Lifex_cost_FiltersWidget.onCheckNode,

        };


        var jstreeData = [
            {   id: "Filters",
                text: "Filters",
                parent: "#",
                data: {
                    id: "Filters",
                    label: "Filters",
                    uri : ""
                }
            },
            {
                id: "JobCard",
                text: "JobCard",
                parent: "Filters",
                data: {
                    id: "JobCard",
                    label: "JobCard",
                    uri : Lifex_cost.lifexUri+"JobCard"
                }

            },
            {
                id: "Phase",
                text: "Phase",
                parent: "Filters",
                data: {
                    id: "Phase",
                    label: "Phase",
                    uri : Lifex_cost.lifexUri+"Phase"
                }

            },
            {
                id: "Discipline",
                text: "Discipline",
                parent: "Filters",
                data: {
                    id: "Discipline",
                    label: "Discipline",
                    uri : "http://rds.posccaesar.org/ontology/lis14/rdl/Role"
                }

            }




        ];

        JstreeWidget.loadJsTree(self.jstreeDiv, jstreeData, options, function (err) {

            $('#'+Lifex_cost_FiltersWidget.jstreeDiv).jstree().open_node("Filters");
            $("#" + self.jstreeDiv).on("hover_node.jstree", function (e, data) {
                return;
                
            });
          


        });

        // Containers_tree.search("Lifex_cost_jstreeFilterDiv", source, options);


    };

    self.onSelectedNodeTreeclick = function (event, obj, callback) {
        self.currentNode = obj.node;
        var jstreeData = [];
        var sparql_url = Config.sources[Lifex_cost.currentSource].sparql_server.url;
        if ((sparql_url = "_default")) {
            sparql_url = Config.sparql_server.url;
        }

        if (obj.node.parent != "#") {
            $("#" + self.jstreeDiv).jstree().check_node(obj.node.id)
        }

        var url = sparql_url + "?format=json&query=";
        // node has already a filter
        if(self.currentBotFilters.filter(function(filter){return filter.jstreeNode==self.currentNode.id}).length>0){
            return self.deleteFilter(self.currentNode.id);
        }


        if (self.currentNode.id == "JobCard") {
            var jstreeData = [];
            var JC_node=Lifex_cost.KGqueryGraph.nodes.filter(function(node){return node.id==(Lifex_cost.lifexUri+"JobCard")})[0];
            var uniqueNonObjectProperties=[];
            Object.values(JC_node.data.nonObjectProperties).forEach(function(prop){
                if(!uniqueNonObjectProperties[prop.id]){
                    uniqueNonObjectProperties[prop.id]=1;
                    var node = {
                        id: prop.id,
                        text: prop.label,
                        parent: "JobCard",
                        type: "",
                        data: {
                            type: "",
                            source: Lifex_cost.currentSource,
                            id: prop.id,
                            label: prop.label,
                            parent: "JobCard",
                            datatype:prop.datatype,
                            uri : prop.id
                            //tabId: options.tabId,
                        }
                    };
                    jstreeData.push(node);
                }
            });
            JstreeWidget.addNodesToJstree(self.jstreeDiv, self.currentNode.id, jstreeData, null, function () {
                //  $("#" + self.jstreeDiv).jstree().check_node(self.currentNode.id);
                if (callback) {
                    return callback();
                }
                jstreeData.forEach(function(node){
                    $('#'+self.jstreeDiv).jstree('uncheck_node', node.id); 
                })   

            });
            

            
        } else if (self.currentNode.id == "Phase") {
            var query=`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    SELECT distinct * FROM <${Lifex_cost.lifexUri}> WHERE {
                    ?sub rdfs:subClassOf <${Lifex_cost.lifexUri}Phase> .
                    ?sub rdfs:label ?label.
            } `;
            var jstreeData = [];
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: Lifex_cost.currentSource }, function (err, result) {
                
                result.results.bindings.forEach(function(phase){
                    var node = {
                        id: phase.sub.value,
                        text: phase.label.value,
                        parent: Lifex_cost.lifexUri+"Phase",
                        type: "",
                        data: {
                            type: "",
                            source: Lifex_cost.currentSource,
                            id: phase.sub.value,
                            label: phase.label.value,
                            parent: Lifex_cost.lifexUri+"Phase",
                            uri : phase.sub.value
                            //tabId: options.tabId,
                        }
                    };
                    jstreeData.push(node);
                });
                JstreeWidget.addNodesToJstree(self.jstreeDiv, self.currentNode.id, jstreeData, null, function () {
                    //  $("#" + self.jstreeDiv).jstree().check_node(self.currentNode.id);
                    if (callback) {
                        return callback();
                    }
                    jstreeData.forEach(function(node){
                        $('#'+self.jstreeDiv).jstree('uncheck_node', node.id); 
                    })   
    
                });

            });

        }else if(self.currentNode.parent == "Phase"){
            var jstreeData = [];
            var JC_node=Lifex_cost.KGqueryGraph.nodes.filter(function(node){return node.id==self.currentNode.id})[0];
            var uniqueNonObjectProperties=[];
            Object.values(JC_node.data.nonObjectProperties).forEach(function(prop){
                if(!uniqueNonObjectProperties[prop.id]){
                    uniqueNonObjectProperties[prop.id]=1;
                    var node = {
                        id: prop.id+'_'+self.currentNode.text,
                        text: prop.label,
                        parent: self.currentNode.id,
                        type: "",
                        data: {
                            type: "",
                            source: Lifex_cost.currentSource,
                            id: prop.id+'_'+self.currentNode.text,
                            label: prop.label,
                            parent: self.currentNode.id,
                            datatype:prop.datatype,
                            uri:prop.id
                            //tabId: options.tabId,
                        }
                    };
                    jstreeData.push(node);
                }
            });
            JstreeWidget.addNodesToJstree(self.jstreeDiv, self.currentNode.id, jstreeData, null, function () {
                //  $("#" + self.jstreeDiv).jstree().check_node(self.currentNode.id);
                if (callback) {
                    return callback();
                }
                //$('#'+self.jstreeDiv).jstree('check_node',  self.currentNode.id); 
                jstreeData.forEach(function(node){
                    $('#'+self.jstreeDiv).jstree('uncheck_node', node.id); 
                })         
                
                

            });
        }else if(self.currentNode.id=='Discipline'){
            var query=`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            SELECT distinct *  FROM <http://data.total/resource/tsf/dalia-lifex-costs/>   WHERE{
            ?sub rdf:type <http://rds.posccaesar.org/ontology/lis14/rdl/Role> .
            ?sub rdfs:label ?label.
            }
             `;
            var jstreeData = [];
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: Lifex_cost.currentSource }, function (err, result) {
                
                result.results.bindings.forEach(function(discipline){
                    var node = {
                        id: discipline.sub.value,
                        text: discipline.label.value,
                        parent: "Discipline",
                        type: "",
                        data: {
                            type: "",
                            source: Lifex_cost.currentSource,
                            id: discipline.sub.value,
                            label: discipline.label.value,
                            parent: Discipline,
                            uri : discipline.sub.value
                            //tabId: options.tabId,
                        }
                    };
                    jstreeData.push(node);
                });
                JstreeWidget.addNodesToJstree(self.jstreeDiv, self.currentNode.id, jstreeData, null, function () {
                    //  $("#" + self.jstreeDiv).jstree().check_node(self.currentNode.id);
                    if (callback) {
                        return callback();
                    }
                    jstreeData.forEach(function(node){
                        $('#'+self.jstreeDiv).jstree('uncheck_node', node.id); 
                    })   
    
                });

            });
        }else if(self.currentNode.parent=='Discipline'){
            
        }
        else {
            self.startBotForDatatypeFilter(self.currentNode);
        }

        /* if (callback) {
             return callback();
         }*/

    };


    self.getContextJstreeMenu = function () {

        var items = {};
        items["Group by"] = {
            label: "Group by",
            action: function (_e) {


                var node = $("#" + self.jstreeDiv).jstree().get_node($(_e.reference[0]).attr("id").replace("_anchor", ""));
                self.currentNode = node;
                var nodeParents = self?.currentNode?.parents;
                if (nodeParents.length > 1) {
                    var topNodeId = self.currentNode.parents[self.currentNode.parents.length - 2];
                } else {
                    var topNodeId = self.currentNode.id;
                }


                var topNode = $("#" + self.jstreeDiv).jstree().get_node(topNodeId);

                if (topNodeId != "TaskKeyword") {
                    self.onSelectedNodeTreeclick(null, {node: topNode}, function () {
                        self.draw2dChart(topNode.text);

                    });
                } else {
                    self.draw2dChart(topNode.text);
                }


            }
        };


        return items;

    };

    

    self.startBotForDatatypeFilter= function(jstreeNode){
        if(jstreeNode.parent.includes('Phase') && jstreeNode.parent!='Phase'){
            $('#'+Lifex_cost_FiltersWidget.jstreeDiv).jstree('get_checked').forEach(function(nodeId){
                if(nodeId.includes('Phase') && nodeId!='Phase'){
                    $('#'+Lifex_cost_FiltersWidget.jstreeDiv).jstree().select_node(nodeId);
                }
            })
        }
        var nodeToFilter=[];
        if(jstreeNode.parent.includes('Phase')){
            
            var jstree_nodes=Object.values($('#'+Lifex_cost_FiltersWidget.jstreeDiv).jstree()._model.data);
            jstree_nodes.forEach(function(node){
                if(node.id!="#"){
                    //var node=$('#'+self.jstreeDiv).jstree('get_node',nodeId);
                if(node.data.uri==jstreeNode.data.uri){
                    nodeToFilter.push(node);
                }
                }
                
            });
            
            
        }

        var parent_node=$('#'+self.jstreeDiv).jstree().get_node(jstreeNode.parent)
        var parentLabel=parent_node.text;
        var parentURI=parent_node.data.uri;
        
        var KGquery_node=Lifex_cost.KGqueryGraph.nodes.filter(function(node){return node.id==parentURI})[0];
        var currentFilterQuery={
            currentClass: parentURI,
            property : jstreeNode.data.uri,
            source : Lifex_cost.currentSource,
            varName : parentLabel
        }
        KGquery_filter_bot.start(KGquery_node.data, currentFilterQuery, function (err, result) {
            
            if(nodeToFilter.length>0){
                nodeToFilter.forEach(function(node){

                    // we suppose that we can't have only one filter by datatype property
                    /*// do it only for node that haven't already a filter 
                    if(self.currentFilter.filter(function(filter){return filter.jstreeNode==node.id}).length>0){
                        return;
                    }*/


                    $('#'+self.jstreeDiv).jstree('set_text', node.id, `<i class="slsv-invisible-button filterIcon"><span style='margin-left:25px;font-family: Arial, Helvetica, sans-serif;font-size: 1em;color:black'>${node.text} </span></i> `);
                    var newFilter=JSON.parse(JSON.stringify(result));
                    var currentNode_parent_text=$('#'+self.jstreeDiv).jstree().get_node(jstreeNode.parent).text
                    var node_parent_text=$('#'+self.jstreeDiv).jstree().get_node(node.parent).text
                    newFilter.filter=newFilter.filter.replace(currentNode_parent_text,node_parent_text);
                    newFilter.filterParams.varName=node_parent_text;
                    newFilter.jstreeNode=node.id;
                    self.currentBotFilters.push(newFilter);
                    $("#" + self.jstreeDiv).jstree().check_node(node.id);
                });
            }else{
                var newFilter=JSON.parse(JSON.stringify(result));
                newFilter.jstreeNode=jstreeNode.id;
                self.currentBotFilters.push(newFilter);
                $('#'+self.jstreeDiv).jstree('set_text', jstreeNode.id, `<i class="slsv-invisible-button filterIcon"><span style='margin-left:25px;font-family: Arial, Helvetica, sans-serif;
                font-size: 1em;color:black'>${jstreeNode.text} </span></i> `);
                $("#" + self.jstreeDiv).jstree().check_node(jstreeNode.id);
            }

        });

    };





    self.getFilter=function(options){
        // refactoring of this function 

        // Defining parameters
        if(!options){
            options={};
        }
        var filterStr='';
        var filters={JobCard:[],Phase:[],Discipline:[]};
        var variablesToAdd={};
        var subqueries=[];
        self.filterTitleMap={JobCard:'',Phase:'',Discipline:''};
        var hasPhaseFilter=false;
        // Récupération des informations à filtrer 
            //  get checked disciplines
            var disciplines_checked=[];
            var jstree_nodes=$('#'+Lifex_cost_FiltersWidget.jstreeDiv).jstree('get_checked');
            Lifex_cost_FiltersWidget.currentBotFilters=Lifex_cost_FiltersWidget.currentBotFilters.filter(function(filter){return filter.filterParams.varName!='Discipline'});
            jstree_nodes.forEach(function(nodeId){
                    var node=$('#'+Lifex_cost_FiltersWidget.jstreeDiv).jstree('get_node',nodeId);
                    if(node.parent=='Discipline'){
                        disciplines_checked.push(nodeId);
                    }
                    
                    
            });
            // Get phases checked
            var checked_phases=[];
            jstree_nodes.forEach(function(nodeId){
                var node=$('#'+Lifex_cost_FiltersWidget.jstreeDiv).jstree('get_node',nodeId);
                
                    if(node.parent=='Phase' && !checked_phases.includes(node.parent)){

                        checked_phases.push(node.id);
                    }
                
                
            });
           
            
            // Get datatype properties filter relatives to bots
            if(Lifex_cost_FiltersWidget.currentBotFilters.length>0){
                Lifex_cost_FiltersWidget.currentBotFilters.forEach(function(filter){
                    
                    if(filter.filterParams.varName.includes('Phase')){
                        hasPhaseFilter=true;
                        if(!checked_phases.includes(Lifex_cost.lifexUri+filter.filterParams.varName)){
                            checked_phases.push(Lifex_cost.lifexUri+filter.filterParams.varName);
                        }
                        
                        var filter_to_add=filter.filter.replace(filter.filterParams.varName+'_','');
                        if(!filters['Phase'].includes(filter_to_add)){
                            filters['Phase'].push(filter_to_add);
                        }
                        

                        if(!variablesToAdd['phase_'+filter.filterParams.propertyLabel]){
                                
                                variablesToAdd['phase_'+filter.filterParams.propertyLabel]=`OPTIONAL{?phase <${filter.filterParams.property}> ?${filter.filterParams.propertyLabel}. }`;
                        }
                            
                        
                        
                        
                    }
                    else if(filter.filterParams.varName=='JobCard' && filter.filterParams.propertyLabel!='label' ){
                        
                        variablesToAdd[`${filter.filterParams.varName}_${filter.filterParams.propertyLabel}`]=`OPTIONAL{?JobCard <${filter.filterParams.property}> ?${filter.filterParams.varName}_${filter.filterParams.propertyLabel}.}`
                        
                        filters['JobCard'].push(filter.filter);
                    }
                    else{
                        filters['JobCard'].push(filter.filter);
                    }
                });
            }
        // Generate filters depending options and filters
        
        if(checked_phases.length>0){
            self.filterTitleMap['Phase']=checked_phases.map(item => `${item.replace(Lifex_cost.lifexUri,'')}`).join(',');

            var typeFilterStr=checked_phases.map(item => `<${item}>`).join(',');
            filters['Phase'].push(`FILTER(?phaseType in(${typeFilterStr}))`);
            hasPhaseFilter=true;
        }
        if(disciplines_checked.length>0){
            self.filterTitleMap['Discipline']=disciplines_checked.map(item => `${item.replace(Lifex_cost.lifexUri,'').replaceAll('_',' ')}`).join(',');

            var disciplineFilterStr=disciplines_checked.map(item => `<${item}>`).join(',');
            variablesToAdd['Discipline']=`?Discipline <http://rds.posccaesar.org/ontology/lis14/rdl/realizedIn> ?JobCard. ?Discipline rdfs:label ?Discipline_label.`
            filters['Discipline'].push(`FILTER (?Discipline  in(${disciplineFilterStr}) )`);
        }
        if(hasPhaseFilter ){
            variablesToAdd['phase'] =` ?phase <http://rds.posccaesar.org/ontology/lis14/rdl/activityPartOf> ?JobCard.
                ?phase rdf:type ?phaseType.
                ?phaseType rdfs:label ?phaseType_label.`;
        }
        var variablesToAddStr='';
        for(var key in variablesToAdd){
            if( (key.toLowerCase()).includes('phase')){ 
                if(options.addPhase){
                    variablesToAddStr+=variablesToAdd[key];
                    
                }
            }else if(key.includes('JobCard')){
                if(options.addJobCard){
                    variablesToAddStr+=variablesToAdd[key];
                }
            }else{
                variablesToAddStr+=variablesToAdd[key];
            }
        }
        if(filters['JobCard'].length >0  || filters['Phase'].length>0 || filters['Discipline'].length>0 ){
            
            filterStr=`${variablesToAddStr}
            ${filters['Phase'].join('.')}
             ${filters['Discipline'].join('.')}
             ${filters['JobCard'].join('.')}`


             //set titleMap
             for (var key in filters){
                filters[key].forEach(function(filter){
                    if(!filter.includes('in')){
                        var regex = /FILTER\s*\((.*?)\)\s*$/;
                        var insideFilter=filter.match(regex)[1];
                        regex = /\^\^xsd:\w+/;
                        var cleaned_inside_filter=insideFilter.replace(regex, '');
                        self.filterTitleMap[key]+=cleaned_inside_filter.replaceAll('"','').replaceAll('?','')+',';


                        
                    }
                })
                
             }
            
        }

        


        
        return {filter:filterStr,subQueries:subqueries}
    }
    self.deleteFilter=function(nodeId){
        var node= $("#" + self.jstreeDiv).jstree().get_node(nodeId);
        var nodeToApply=[];
        var jstree_nodes=Object.values($('#'+Lifex_cost_FiltersWidget.jstreeDiv).jstree()._model.data);
        jstree_nodes.forEach(function(current_node){
            if(current_node.id!="#"){
                //var node=$('#'+self.jstreeDiv).jstree('get_node',nodeId);
                if(node.data.uri==current_node.data.uri){
                    nodeToApply.push(current_node);
                }
            }
            
        });
        nodeToApply.forEach(function(current_node){
            
            $("#" + self.jstreeDiv).jstree('uncheck_node', current_node.id);
            var regex=/<span[^>]*>(.*?)<\/span>/g;
            var inside_span=regex.exec(current_node.text);
            if(inside_span){
                var initial_text=inside_span[1];
                $('#'+self.jstreeDiv).jstree('set_text',current_node.id,initial_text);
            }
            self.currentBotFilters=self.currentBotFilters.filter(function(filter){return filter.jstreeNode!=current_node.id});
        });
        
        
        

        
    }
    self.onUnCheckNode=function(e,data){
        self.deleteFilter(data.node.id);
        if(data.node.children.length>0){
            data.node.children.forEach(function(nodeId){
                self.deleteFilter(nodeId);
            })

        }

    }
    self.onCheckNode=function(e,data){
        if(data.node.parent=='Phase'){
            //var filter_onPhaseDatatypeProperty=self.currentFilter.filter(function(filter){return filter.jstreeNode.includes('Phase')});

            // already a filter on a phase datatype property then filter on the same properties with the new Phase
           /* if(filter_onPhaseDatatypeProperty.length>0){
                $('#'+Lifex_cost_FiltersWidget.jstreeDiv).jstree().select_node(data.node.id);
                filter_onPhaseDatatypeProperty.forEach(function(filter){
                    filter.js})
            }*/
            // only check phase and delete opened datatype phase properties
            //else{
                var childrens=JSON.parse(JSON.stringify(data.node.children));
                childrens.forEach(function(nodeId){
                    self.deleteFilter(nodeId);
                    $('#'+self.jstreeDiv).jstree().delete_node(nodeId);
                    
                });
                $('#'+self.jstreeDiv).jstree().check_node(data.node.id);
            //}
            
            
        }
    }
        self.setTitle=function(cumulValue,isList){
            var yAxis=$('#Lifex_cost_quantityVarSelect').val();
            var splitBy=$('#Lifex_cost_SplitBySelect').val();
            if(Lifex_cost_charts.isDailyDistribution){
                var yAxis=$('#Lifex_cost_quantityVarSelect_daily').val();
                var splitBy=$('#Lifex_cost_SplitBySelect_daily').val();
            }
            if(splitBy==""){
                splitBy='global'
            }else{
                splitBy='By '+splitBy;
            }
            var JobCardStr=''
            var DisciplineStr='';
            var PhaseStr='' ;
            if(Lifex_cost_FiltersWidget.filterTitleMap['JobCard'].length>0){
                JobCardStr=`<span> Jobcards : ${Lifex_cost_FiltersWidget.filterTitleMap['JobCard']}</span>`;
                
            }
            if(Lifex_cost_FiltersWidget.filterTitleMap['Discipline'].length>0){
               DisciplineStr=`<span> Discipline : ${Lifex_cost_FiltersWidget.filterTitleMap['Discipline']}</span>`
                
            }
            if(Lifex_cost_FiltersWidget.filterTitleMap['Phase'].length>0){
                PhaseStr=`<span> Phase : ${Lifex_cost_FiltersWidget.filterTitleMap['Phase']}</span>`
                 
             }
            var title=`<span>${yAxis} ${splitBy} / Total : ${cumulValue} / Filters : </span>
             ${JobCardStr}
             ${DisciplineStr}
             ${PhaseStr}

            `;
            if(isList){
                title=` List / Filters :
                ${JobCardStr}
                ${DisciplineStr}
                ${PhaseStr}
                `;
            }
            if(isList){
                $('#listTitle').html(title);
            }else{
                $('#chartTitle').html(title);
            }
            
        }

    
        /*self.onSelectedNodeTreeclick(e,data,function(){
            $('#'+self.jstreeDiv).jstree().check_node(data.id);
        });*/
    
    return self;
})();

export default Lifex_cost_FiltersWidget;
window.Lifex_cost_FiltersWidget = Lifex_cost_FiltersWidget;

