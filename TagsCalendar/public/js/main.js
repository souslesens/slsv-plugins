var TagsCalendar = (function() {
        var self = {};


        self.onLoaded = function() {


            $("#lateralPanelDiv").load("/plugins/TagsCalendar/html/tagsCalendar_leftPanel.html", function() {
                $("#graphDiv").load("/plugins/TagsCalendar/html/tagsCalendar_rightPanel.html", function(x, y) {
                    //  self.drawTimeLine();

                });
            });
        };

        self.drawSparqlResultTimeLine = function(sparqlresult) {

            self.sparqlresult = sparqlresult;
            var index = 1;

            var obj = sparqlresult.data[0];

            var dates = [];
            var labels = [];
            var ids = [];
            var groups = [];
            for (var key in obj) {
                var prop = obj[key];
                if (prop.datatype && prop.datatype.indexOf("date") > -1) {
                    dates.push(key);

                } else {

                    if (key.indexOf("label") > -1) {
                        labels.push(key);
                        groups.push(key);
                        

                    } else {
                        ids.push(key);
                    }
                }

            }
            common.fillSelectOptions("tagsCalendar_startDateSelect", dates, true);
            common.fillSelectOptions("tagsCalendar_endDateSelect", dates, true);
            common.fillSelectOptions("tagsCalendar_labelSelect", labels, true);
            common.fillSelectOptions("tagsCalendar_idSelect", ids, true);
            common.fillSelectOptions("tagsCalendar_groupBySelect", labels, true);


        };

        self.onDrawButtonClick = function() {


            var startDateVarName = $("#tagsCalendar_startDateSelect").val();
            var endDateVarName = $("#tagsCalendar_endDateSelect").val();
            var labelVarName = $("#tagsCalendar_labelSelect").val();
            var idVarName = $("#tagsCalendar_idSelect").val();
            var groupByVarName = $("#tagsCalendar_groupBySelect").val();
            var expandAll = $("#tagsCalendar_expandGroups").prop("checked");


            if (!startDateVarName) {
                return alert("startDate is mandatory");
            }
            if (!labelVarName) {
                return alert("label is mandatory");
            }
            if (!idVarName) {
                return alert("id is mandatory");
            }


            var data = [];
            var existingIds = {};

            self.groupsMap = {};
            var groupsData;

            if (groupByVarName) {
                groupsData = self.getGroups(groupByVarName);
            }
            self.sparqlresult.data.forEach(function(item) {


                var id = item[idVarName].value;
                var label = item[labelVarName].value;
                if (!existingIds[id]) {
                    existingIds[id] = 1;
                    if (id && label && item[startDateVarName]) {


                        var obj = {
                            id: id,
                            content: label,
                            start: item[startDateVarName].value

                        };
                        if (endDateVarName && item[endDateVarName]) {
                            obj.end = item[endDateVarName].value;
                        }
                        if (groupByVarName && item[groupByVarName]) {
                            var groupId=item[groupByVarName].value
                            var p = groupId.lastIndexOf("/");
                            if (p > -1) {
                                groupId = groupId.substring(0, p);
                            }

                            if (self.groupsMap[groupId]) {
                                obj.group = groupId;
                            } else {
                                var x = 3;
                            }

                        }
                        data.push(obj);
                    }
                }
            });


            if (groupByVarName) {
                var groupsDataset = new vis.DataSet();
                groupsDataset.add(groupsData);
                self.drawTimeLine(data, groupsDataset);

            } else {
                self.drawTimeLine(data);
            }

        };


        self.getGroups = function(groupVarName) {

            var existingIds = {};
            self.sparqlresult.data.forEach(function(item) {
                var obj = item[groupVarName];
                if (!obj) {
                    return;
                }

                var array = obj.value.split("/");
                if (array.length > 1) {//groups
                    var id = "";
                    array.forEach(function(item2, index) {
                        if (index > 0) {
                            id += "/";
                        }
                        id += item2;//.trim();
                        if (!existingIds[id]) {
                            if (index < array.length - 1) {
                                if (!self.groupsMap[id]) {
                                    self.groupsMap[id] = { id: id, label: item2, contents: [], level: index + 1 };
                                }
                                if (index < array.length - 2) {
                                    if (!self.groupsMap[id].nestedGroups) {
                                        self.groupsMap[id].nestedGroups = [];
                                    }
                                    var nestedId = id + "/" + array[index + 1];
                                    if (self.groupsMap[id].nestedGroups.indexOf(nestedId) < 0) {
                                        self.groupsMap[id].nestedGroups.push(nestedId);
                                    }
                                }
                            } else {

                            }
                        }
                    });

                } else {
                    self.groupsMap[obj.value] = { id: obj.value, label: obj.value };
                }

            });
            var groupsData = [];
            for (var key in self.groupsMap) {
                var item = self.groupsMap[key];
                var groupObj = {
                    id: key,
                    treeLevel: item.level,
                    content: item.label
                };
                var expandAll = $("#tagsCalendar_expandGroups").prop("checked");
                if (!expandAll && item.level > 2) {
                    groupObj.showNested = false;
                }


                if (item.nestedGroups && item.nestedGroups.length > 0) {
                    groupObj.nestedGroups = [];

                    item.nestedGroups.forEach(function(nestedGroup) {

                        groupObj.nestedGroups.push(nestedGroup);
                    });
                }

                groupsData.push(groupObj);
            }

            return groupsData;

        };


        self.drawTimeLine = function(items, groups) {

            var container = document.getElementById("graphDiv");
            if (!items) {
                items = self.testData;
            }
            var options = {
                editable: false,
                height: "750px",
                maxHeight: "750px",
                //   margin: { item: { vertical: 1 } },
                verticalScroll: true,
                horizontalScroll: true
                //  preferZoom:true
            };
            if (self.timeline != null) {
                self.timeline.destroy();
            }
            self.timeline;
            if (groups) {
                self.timeline = new vis.Timeline(container, items, groups, options);
            } else {
                self.timeline = new vis.Timeline(container, items, options);
            }


            self.timeline.on("changed", function() {
            });
            self.timeline.on('itemover',function(properties){
                if(properties.item){
                    
                    var data=self.timeline.itemsData.get(properties.item);
                    if(data.content){
                        var html = "<div>Label : " + data.content+ "</div>";
                    
                    
                        if(data.start){
                            html+="<div>Start Date : " + data.start.toISOString().split('T')[0] + "</div>";
                        }
                        if(data.end){
                            html+="<div>End Date : " + data.end.toISOString().split('T')[0]  + "</div>";
                        }
                        PopupMenuWidget.initAndShow(html, "popupMenuWidgetDiv");
                    }
                }
                
                
                
            });
            self.timeline.on('itemout',function(properties){

                    PopupMenuWidget.hidePopup( "popupMenuWidgetDiv");
                
            });

            self.timeline.on("click", function(properties) {
                if (properties && properties.item) {
                    NodeInfosWidget.showNodeInfos(KGquery.currentSource, properties.item, "mainDialogDiv");
                }

            });

        };

        self.onLabelSelect = function() {
            var labelVarName = $("#tagsCalendar_labelSelect").val();
            $("#tagsCalendar_idSelect").val(labelVarName.replace("_label", ""));
            $("#tagsCalendar_groupBySelect").val(labelVarName);

        }

        return self;


    }


)
();
export default TagsCalendar;
window.TagsCalendar = TagsCalendar;