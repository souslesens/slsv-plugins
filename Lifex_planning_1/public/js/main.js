import TimeLineEventManager from "./timeLineEventManager.js";
import SavedQueriesWidget from "../../../../vocables/modules/uiWidgets/savedQueriesWidget.js";
import KGquery_myQueries from "../../../../vocables/modules/tools/KGquery/KGquery_myQueries.js";
import DataManager from "./dataManager.js";
import FilterTree from "./filterTree.js";
import CustomNodeInfos from "./customNodeInfos.js";

var Lifex_planning = (function() {
        var self = {};
        /*$('.vis-inner').filter(function() {
        return $(this).text()=='Structure';
      }).offset().top()*/
        self.currentSource = "LIFEX-DALIA_1";
        
        self.onLoaded = function() {


            $("#lateralPanelDiv").load("/plugins/Lifex_planning/html/leftPanel.html", function() {
                // CRUDsource, slsvSource, scope, targetSelect, callback
                //   SavedQueriesWidget.list("STORED_KGQUERY_QUERIES", self.currentSource, null,"tagsCalendarSoredQueries" );
                FilterTree.loadTree(self.currentSource);
                DataManager.loadQuery();


                $("#graphDiv").load("/plugins/Lifex_planning/html/rightPanel.html", function(x, y) {
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

                    if (prop.type != "uri") {
                        if (prop.datatype) {
                            if (prop.datatype.indexOf("int") == -1 && prop.datatype.indexOf("float") == -1) {
                                labels.push(key);
                                groups.push(key);
                            }
                        } else {
                            labels.push(key);
                            groups.push(key);
                        }


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


            dates.forEach(function(date) {
                if (date.toLowerCase().indexOf("start") > -1) {
                    $("#tagsCalendar_startDateSelect").val(date);
                }
                if (date.toLowerCase().indexOf("end") > -1) {
                    $("#tagsCalendar_endDateSelect").val(date);
                }
            });


        };

        self.draw = function(sparqlData, refDate) {


            var startDateVarName = "WBS_activity_startDate";// $("#tagsCalendar_startDateSelect").val();
            var endDateVarName = "WBS_activity_endDate";//$("#tagsCalendar_endDateSelect").val();
            var labelVarName = "WBS_activity_label";//$("#tagsCalendar_labelSelect").val();
            var idVarName = "WBS_activity";//$("#tagsCalendar_idSelect").val();
            var groupByVarName = null;//"JobCardExecution_label";// $("#tagsCalendar_groupBySelect").val();
            var currentClassName = "vis-item";//$("#tagsCalendar_classNameSelect").val();

            if (sparqlData.length > 500) {
                currentClassName="calendar-period-slim"
            }
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
                groupsData = self.getGroups(sparqlData, groupByVarName);
            } else {
                groupsData = {
                    id: "_",
                    content: "  "
                };
            }

            sparqlData.forEach(function(item) {


                var id = item[idVarName].value;
                var label = item[labelVarName].value;
                if (!existingIds[id]) {
                    existingIds[id] = 1;
                    if (id && label && item[startDateVarName]) {

                        var startDate = item[startDateVarName].value;
                        if (true || !startDate instanceof Date) {
                            startDate = startDate.substring(0, 10).replace(/-/g, ".");
                            try {
                                startDate = new Date(startDate);
                            } catch (e) {
                                return;
                            }
                        }
                        var obj = {
                            id: id,
                            content: label,
                            start: startDate,
                            className: currentClassName

                        };

                        if (endDateVarName && item[endDateVarName]) {
                            obj.end = item[endDateVarName].value;
                        }
                        if (groupByVarName && item[groupByVarName]) {
                            var groupId = item[groupByVarName].value;
                            var p = groupId.lastIndexOf("/");
                            if (p > -1) {
                                groupId = groupId.substring(0, p);
                            }

                            if (self.groupsMap[groupId]) {
                                obj.group = groupId;
                            } else {
                                var x = 3;
                            }

                        } else {
                            obj.group = "_";
                        }
                        data.push(obj);
                    } else {
                        var x = 3;
                    }
                }
            });


            if (true || groupByVarName) {
                var groupsDataset = new vis.DataSet();
                groupsDataset.add(groupsData);
                self.drawTimeLine(data, groupsDataset);


            } else {
                self.drawTimeLine(data);
            }
            if (refDate) {
                self.timeline.addCustomTime(refDate);
            }
            $("#tagsCalendar_focusDiv").show();
            // common.fillSelectOptions("tagsCalendar_focusOnGroup", groupsData.map(object=>object.id), true);
        };


        self.getGroups = function(sparqlData, groupVarName) {

            var existingIds = {};
            sparqlData.forEach(function(item) {
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
                // height: "300px",
                maxHeight: "850px",
                //  margin: { item: { vertical: 1 } },
                verticalScroll: true,
                groupHeightMode: "fixed",
                orientation: { axis: "both" }
                //  horizontalScroll: true
                //  preferZoom:true
            };


            for (var key in TimeLineEventManager.timeLineOptions) {
                options[key] = TimeLineEventManager.timeLineOptions[key];
            }


            if (self.timeline != null) {
                try {
                    self.timeline.destroy();
                } catch (e) {
                    console.log(e);
                }
            }
            if (groups) {
                self.timeline = new vis.Timeline(container, items, groups, options);
            } else {
                self.timeline = new vis.Timeline(container, items, options);
            }


            self.timeline.on("changed", function() {
            });
            self.timeline.on("itemover", function(properties) {
                if (properties.item) {

                    var data = self.timeline.itemsData.get(properties.item);
                    if (data.content) {
                        var html = "<div>Label : " + data.content + "</div>";


                        if (data.start) {
                            html += "<div>Start Date : " + data.start.toISOString().split("T")[0] + "</div>";
                        }
                        if (data.end) {
                            html += "<div>End Date : " + data.end.toISOString().split("T")[0] + "</div>";
                        }
                        PopupMenuWidget.initAndShow(html, "popupMenuWidgetDiv");
                    }
                }


            });
            self.timeline.on("itemout", function(properties) {

                PopupMenuWidget.hidePopup("popupMenuWidgetDiv");

            });

            self.timeline.on("click", function(properties) {

                if (properties && properties.item) {
                    CustomNodeInfos.showNodeInfos(properties.item);
                }

            });


        };
        self.focusOnDate = function(minDate, maxDate) {
            self.timeline.setWindow(minDate, maxDate);
        };
        self.onLabelSelect = function() {
            var labelVarName = $("#tagsCalendar_labelSelect").val();
            $("#tagsCalendar_idSelect").val(labelVarName.replace("_label", ""));
            //   $("#tagsCalendar_groupBySelect").val(labelVarName);

        };

        self.convertISOStringDateForTriple = function(isoStringdate) {
            // isoString 2022-12-31T230000.000Z
            //  internal virtuoso date YYYY.MM.DD hh:mm.ss
            var regex = /(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})/;
            var array = isoStringdate.match(regex);
            if (!array) {
                return null;
            }
            var str = array[1] + "." + array[2] + "." + array[3];

            if (array.length > 4) {
                str += " " + array[4];
            }
            if (array.length > 5) {
                str += ":" + array[5];
            }
            if (array.length > 6) {
                str += ":" + array[6];
            }
            return str;


        };
        


        return self;


    }


)
();
export default Lifex_planning;
window.Lifex_planning = Lifex_planning;