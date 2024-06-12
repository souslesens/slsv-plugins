import DataManager from "./dataManager.js";


var FilterTree = (function() {

    var self = {};
    self.jstreeDiv = "Lifex_planning_jstreeFilterDiv";
    self.idsMap = {};
    self.loadTree = function(source) {

        self.currentSource = source;

        var options = {
            openAll: false,
            withCheckboxes: true,

            contextMenu: FilterTree.getContextJstreeMenu(),
            selectTreeNodeFn: FilterTree.onSelectedNodeTreeclick

        };


        var jstreeData = [
            {
                id: "Phase",
                text: "Phase",
                parent: "#"

            },
            {
                id: "FLOC",
                text: "FLOC",
                parent: "#"

            },
            {
                id: "Discipline",
                text: "Discipline",
                parent: "#"

            },
            {
                id: "TaskKeyword",
                text: "Task Keyword",
                parent: "#"

            }

        ];

        JstreeWidget.loadJsTree(self.jstreeDiv, jstreeData, options);

        // Containers_tree.search("Lifex_planning_jstreeFilterDiv", source, options);


    };

    self.sortJstreeData = function(data) {
        data.sort(function(a, b) {
            if (a.text > b.text) {
                return 1;
            }
            if (a.text < b.text) {
                return -1;
            }
            return 0;

        });
    };


    self.onSelectedNodeTreeclick = function(event, obj) {
        self.currentNode = obj.node;
        var jstreeData = [];
        if (self.currentNode.id == "Phase") {
            for (var phase in DataManager.groupLabelsMap) {
                jstreeData.push({
                    id: phase,
                    text: DataManager.groupLabelsMap[phase].label,
                    parent: self.currentNode.id
                });
            }

            self.sortJstreeData(jstreeData);

            JstreeWidget.addNodesToJstree(self.jstreeDiv, self.currentNode.id, jstreeData, null, function() {
                // $("#" + self.jstreeDiv) .jstree() .check_node(self.currentNode.id);

            });

        } else if (self.currentNode.id == "FLOC" || self.currentNode.parents.indexOf("FLOC") > -1) {
            var options = {
                filter: " ?mem"
            };

            var containerId;
            if (self.currentNode.id == "FLOC") {
                containerId = "http://data.total/resource/tsf/dalia-lifex1/FL-DAL";
            } else {
                containerId = self.currentNode.data.id;
            }

            Containers_query.getContainerDescendants(self.currentSource, containerId, {}, function(err, result) {
                if (err) {
                    return alert(err.responsetext);
                }

                var jstreeData = [];

                var existingNodes = {};
                result.results.bindings.forEach(function(item) {
                    var id = item.descendant.value;
                    var label = item.descendantLabel ? item.descendantLabel.value : Sparql_common.getLabelFromURI(item.descendant.value);
                    var jstreeId = "_" + common.getRandomHexaId(5);

                    var parent = self.idsMap[item.descendantParent.value] || self.currentNode.id;

                    if (!self.idsMap[id]) {
                        self.idsMap[id] = jstreeId;
                    }

                    if (!existingNodes[jstreeId]) {
                        existingNodes[jstreeId] = 1;
                    }
                    var node = {
                        id: self.idsMap[id],
                        text: label,
                        parent: parent,
                        type: "Container",
                        data: {
                            type: "Container",
                            source: self.currentSource,
                            id: id,
                            label: label,
                            parent: parent
                            //tabId: options.tabId,
                        }
                    };
                    jstreeData.push(node);
                });

                JstreeWidget.addNodesToJstree(self.jstreeDiv, self.currentNode.id, jstreeData, null, function() {
                    //  $("#" + self.jstreeDiv).jstree().check_node(self.currentNode.id);

                });
            });

        } else if (self.currentNode.id == "Discipline") {
            var jstreeData = [];
            Sparql_OWL.getDistinctClassLabels(self.currentSource, ["http://data.total/resource/tsf/dalia-lifex1/Discipline"], {}, function(err, result) {
                if (err) {
                    return alert(err);
                }
                result.forEach(function(item) {
                    jstreeData.push({
                        id: item.id.value,
                        text: item.label.value,
                        parent: self.currentNode.id
                    });
                    self.sortJstreeData(jstreeData);

                    JstreeWidget.addNodesToJstree(self.jstreeDiv, self.currentNode.id, jstreeData, null, function() {
                        //   $("#" + self.jstreeDiv) .jstree() .check_node(self.currentNode.id);
                    });

                });


            });
        } else if (self.currentNode.id == "TaskKeyword") {

            var keyword = prompt("enter keyword");
            if (!keyword) {
                return;
            }
            var jstreeData = [{
                id: keyword,
                text: keyword,
                parent: self.currentNode.id
            }];
            JstreeWidget.addNodesToJstree(self.jstreeDiv, self.currentNode.id, jstreeData, null, function() {
                $("#" + self.jstreeDiv).jstree().check_node(keyword);
            });
        } else {

        }


        /* if (obj.event.button != 2) {

         }*/
    };


    self.getContextJstreeMenu = function() {

        if (false && self.currentNode.parent == "#") {


            var items = {};
            items["dailyHours"] = {
                label: "dailyHours",
                action: function(_e) {


                }
            };
            return items;
        } else {

            return items;
            items["NodeInfos"] = {
                label: "Node infos",
                action: function(_e) {
                    NodeInfosWidget.showNodeInfos(self.currentSource, self.currentNode, "mainDialogDiv");
                }
            };

            items["Filter"] = {
                label: "Filter by",
                action: function(_e) {

                    var type = self.currentNode.parents[self.currentNode.parents.length - 2];
                }
            };
            items["Draw"] = {
                label: "Filter by",
                action: function(_e) {
                    var type = self.currentNode.parents[self.currentNode.parents.length - 2];
                }
            };
        }

    };

    self.drawChart = function() {

        var checkdNodes = JstreeWidget.getjsTreeCheckedNodes(self.jstreeDiv);
        var ids = [];

        var types = {};
        var filterText = "";
        var subQueries = [];

        checkdNodes.forEach(function(item) {
            if (item.parent == "#") {
                return;
            }
            var type = item.parents[item.parents.length - 2];
            if (!types[type]) {
                types[type] = { ids: [], labels: [] };
            }

            types[type].ids.push(item.id);
            types[type].labels.push(item.text);

            //  ids.push(item.id)

        });

        var filter = "";


        for (var type in types) {

            filterText += "&nbsp;<span class='chartTitle_filterType'>" + type + " : </span>";
            types[type].labels.forEach(function(label) {
                filterText += "&nbsp;<span class='chartTitle_filterItem'>" + label + "</span>";
            });

            if (type == "Discipline") {
                filter += Sparql_common.setFilter("Discipline", types[type].ids);
            } else if (type == "Phase") {
                filter += Sparql_common.setFilter("WBS_activity", null, types[type].ids).replace("WBS_activityLabel", "WBS_activity_label");
            } else if (type == "FLOC") {
                var subquery = " ?JobCardExecution <http://rds.posccaesar.org/ontology/lis14/rdl/hasPassiveParticipant> ?tag.\n" +
                    "?tag <http://rds.posccaesar.org/ontology/lis14/rdl/residesIn> ?FunctionalLocation." +
                    " ?FunctionalLocation  rdf:type <http://data.total/resource/tsf/dalia-lifex1/FunctionalLocation>." +
                    "   ?FunctionalLocation <http://www.w3.org/2000/01/rdf-schema#label> ?FunctionalLocationLabel. ";

                subquery += Sparql_common.setFilter("FunctionalLocation", null, types[type].labels);
                subQueries.push(subquery);
            } else if (type == "TaskKeyword") {
                var subquery = "?JobCardExecution ^<http://rds.posccaesar.org/ontology/lis14/rdl/activityPartOf> ?Task. " +
                    "?Task  rdf:type <http://data.total/resource/tsf/dalia-lifex1/Task>. " +
                    "?Task <http://www.w3.org/2000/01/rdf-schema#label> ?TaskLabel. ";
                subquery += Sparql_common.setFilter("Task", null, types[type].labels);
                subQueries.push(subquery);
            }

        }


        var options = {
            filter: filter,
            subQueries: subQueries
        };

        var chartName = $("#Lifex_planning_chartName").val();

        var title = chartName + " " + filterText;

        $("#tagsCalendarItemsSelect").empty();
        DataManager.setChartTitle(title);
        DataManager.loadQuery(options);


    };


    return self;
})();

export default FilterTree;
window.FilterTree = FilterTree;

