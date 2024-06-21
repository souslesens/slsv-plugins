//import SavedQueriesWidget from "../../../../public/vocables/modules/uiWidgets/savedQueriesWidget.js";


//import Sparql_proxy from "../../../../public/vocables/modules/sparqlProxies/sparql_proxy.js";
//import Lifex_planning from "./main.js";

import TimelineAnimation from "./timelineAnimation.js";

var DataManager = (function() {
        var self = {};
        self.data = [];

        self.groupLabelsMap = {

            "ENG": { label: "1-Detail Engineering", color: "#ddd" },
            "PR": { label: "2-Procurement", color: "#ddd" },
            "PF": { label: "3-Prefabrication ", color: "#ddd" },
            "CNT": { label: "4-Offshore Construction", color: "#ddd" },
            "PRECOM": { label: "5-Offshore Pre-Commissioning", color: "#ddd" },
            "COM": { label: "6-Offshore Commissioning", color: "#ddd" }


        };

        self.executeGraph2DQuery = function(options, callback) {
            if (!options) {
                options = {};
            }
            var url = Config.sources[Lifex_planning.currentSource].sparql_server.url + "?format=json&query=";
            MainController.UI.message("loading data");

            var query = "PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  where {?WBS_activity <http://rds.posccaesar.org/ontology/lis14/rdl/occursRelativeTo> ?JobCardExecution.\n" +
                "?Discipline <http://rds.posccaesar.org/ontology/lis14/rdl/realizedIn> ?JobCardExecution.\n" +
                "\n" +
                "\n" +
                " ?WBS_activity  rdf:type <http://data.total/resource/tsf/PRIMAVERA_TEST/WBS_activity>.  ?JobCardExecution  rdf:type <http://data.total/resource/tsf/dalia-lifex1/JobCardExecution>. ?Discipline  rdf:type <http://data.total/resource/tsf/dalia-lifex1/Discipline>. \n" +
                " OPTIONAL  {?WBS_activity <http://www.w3.org/2000/01/rdf-schema#label> ?WBS_activity_label.}\n" +
                " OPTIONAL  {?WBS_activity <http://data.total/resource/tsf/PRIMAVERA_TEST/startDate> ?WBS_activity_startDate.}\n" +
                " OPTIONAL  {?WBS_activity <http://data.total/resource/tsf/PRIMAVERA_TEST/endDate> ?WBS_activity_endDate.}\n" +
                " OPTIONAL  {?JobCardExecution <http://www.w3.org/2000/01/rdf-schema#label> ?JobCardExecution_label.}\n" +
                " OPTIONAL  {?Discipline <http://www.w3.org/2000/01/rdf-schema#label> ?Discipline_label.}\n" +
                " OPTIONAL  {?WBS_activity <http://data.total/resource/tsf/PRIMAVERA_TEST/durationInHours> ?WBS_activity_durationInHours.}\n";

            if (options.filter) {
                query += options.filter;
            }
            if (options.subQueries) {
                options.subQueries.forEach(function(subQuery) {
                    query += "\n{ SELECT ?JobCardExecution WHERE{" + subQuery + "}}";
                });

            }
            query += " }  limit 10000";

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: Lifex_planning.currentSource }, function(err, result) {
                if (err) {
                    return callback(err);
                }

                MainController.UI.message("", true);

                callback(null, result);
            });
        };
        self.executeTagsQuery = function(options, callback) {
            if (!options) {
                options = {};
            }
            var url = Config.sources[Lifex_planning.currentSource].sparql_server.url + "?format=json&query=";
            MainController.UI.message("loading data");

            var filterStr = "";
            var query = "PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  where {?JobCardExecution <http://rds.posccaesar.org/ontology/lis14/rdl/hasPassiveParticipant> ?tag.\n" +
                "?FunctionalLocation ^<http://rds.posccaesar.org/ontology/lis14/rdl/residesIn> ?tag.\n" +
                "?WBS_activity <http://rds.posccaesar.org/ontology/lis14/rdl/occursRelativeTo> ?JobCardExecution.\n" +
                " ?JobCardExecution  rdf:type <http://data.total/resource/tsf/dalia-lifex1/JobCardExecution>.  ?tag  rdf:type <http://data.total/resource/tsf/dalia-lifex1/tag>.   ?FunctionalLocation  rdf:type <http://data.total/resource/tsf/dalia-lifex1/FunctionalLocation>.  ?WBS_activity  rdf:type <http://data.total/resource/tsf/PRIMAVERA_TEST/WBS_activity>.\n" +
                " OPTIONAL  {?tag <http://www.w3.org/2000/01/rdf-schema#label> ?tag_label.}\n" +
                " OPTIONAL  {?FunctionalLocation <http://www.w3.org/2000/01/rdf-schema#label> ?FunctionalLocation_label.}\n" +
                filterStr +
                "}  limit 10000";

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: Lifex_planning.currentSource }, function(err, result) {
                if (err) {
                    return callback(err);
                }

                MainController.UI.message("", true);

                callback(null, result);
            });
        };


        self.getTagsMap = function(callback) {
            if (self.wbsTagsMap) {

                return callback(null, self.wbsTagsMap);
            } else {
                self.wbsTagsMap = {};
                self.executeTagsQuery(null, function(err, result) {
                    if (err) {
                        return callback(err);
                    }
                    self.wbsTagsMap = {};
                    result.results.bindings.forEach(function(item) {
                        if (!self.wbsTagsMap[item.WBS_activity.value]) {
                            self.wbsTagsMap[item.WBS_activity.value] = [];
                        }
                        self.wbsTagsMap[item.WBS_activity.value].push(item.tag_label.value);
                    });

                    return callback(null, self.wbsTagsMap);
                });
            }
        };


        self.drawGraph2Dchart = function(options) {
            if (!options) {
                options = {};
            }

            self.executeGraph2DQuery(options, function(err, result) {
                self.sparqlData = result.results.bindings;

                self.getTagsMap(function(err, tagsMap) {
                    if (err) {
                        return;
                    }
                    self.sparqlData.forEach(function(item) {
                        item.tags = tagsMap[item.WBS_activity.value];
                    });


                    self.chartData = self.getCumulatedValuesBydate("WBS_activity_durationInHours", "sum", null, null);
                    self.drawChart(self.chartData);

                });


            });

        };


        self.getGroups = function() {
            var dataGroups = {};

            for (var groupId in self.groupLabelsMap) {
                var label = self.groupLabelsMap[groupId].label;
                dataGroups[groupId] = { id: groupId, content: label, data: {} };
            }


            return dataGroups;


        };

        self.getCumulatedValuesBydate = function(quantityName, groupFn, afterDate, beforeDate) {

            var dataGroups = self.getGroups();
            var startDateVarName = "WBS_activity_startDate";//$("#tagsCalendar_startDateSelect").val();
            var endDateVarName = "WBS_activity_endDate";// $("#tagsCalendar_endDateSelect").val();


            var maxItemsTime = new Date(1900, 0, 1).getTime();

            var minRangeTime = null;
            if (afterDate) {
                minRangeTime = afterDate.getTime();
            } else {
                minRangeTime = new Date(2100, 31, 31).getTime();
            }
            var maxRangeTime = null;
            if (beforeDate) {
                maxRangeTime = beforeDate.getTime();
            }
            maxRangeTime = new Date(1900, 0, 1).getTime();


            var itemsInDatesRange = [];

            self.sparqlData.forEach(function(item) {
                if (!item[startDateVarName]) {
                    return;
                }
                if (!item[endDateVarName]) {
                    return;
                }
                if (!item[quantityName]) {
                    return;
                }

                if (!item["WBS_activity"]) {
                    return;
                }

                var startDate = item[startDateVarName].value.substring(0, 10).replace(/-/g, ".");
                try {
                    startDate = new Date(startDate);
                } catch (e) {
                    return;
                }

                item.startTime = startDate.getTime();
                if (false && minRangeTime && minRangeTime < item.startTime) {
                    return;
                } else {
                    minRangeTime = Math.min(item.startTime, minRangeTime);


                }
                var endDate = item[endDateVarName].value.substring(0, 10).replace(/-/g, ".");
                try {
                    endDate = new Date(endDate);
                } catch (e) {
                    return;
                }
                item.endTime = endDate.getTime();
                if (false && maxRangeTime && maxRangeTime > item.endTime) {
                    return;
                } else {
                    maxRangeTime = Math.max(item.endTime, maxRangeTime);
                }
                var group = item.WBS_activity.value.substring(item.WBS_activity.value.lastIndexOf("/") + 1).split("-")[0];


                item.group = group;
                itemsInDatesRange.push(item);
            });


            self.periodTicks = {};
            self.dayPeriodActivities = {};
            var step = 1000 * 60 * 60 * 24;//*7;

            var time = minRangeTime - 1;
            if (!self.animationStartId) {
                self.animationStartId = time;
            }
            do {

                var obj = {
                    id: time,
                    content: "",
                    start: new Date(time),
                    cumul: 0,
                    activities: []
                };

                self.periodTicks[time] = obj;


                time += step;
            }
            while (time <= maxRangeTime);

            var milliSecondsInDay = (1000 * 60 * 60 * 24);


            for (var group in dataGroups) {

                itemsInDatesRange.forEach(function(item) {

                    if (item.group != group) {
                        return;
                    }

                    var n;
                    var datatype = item[quantityName].datatype;
                    var quantity = item[quantityName].value;
                    if (datatype == "http://www.w3.org/2001/XMLSchema#integer") {
                        n = parseInt(quantity);
                    }
                    if (datatype == "http://www.w3.org/2001/XMLSchema#float") {
                        n = parseFloat(quantity);


                    } else {
                        return;
                    }


                    var days = (item.endTime - item.startTime) / milliSecondsInDay;
                    if (days == 0) {
                        days = 1;
                    }
                    //  n = n / (days * 12);


                    for (var time in self.periodTicks) {
                        time = parseInt(time);
                        if (time >= item.startTime) {

                            // console.log((time + step) +"__"+ item.endTime)
                            if ((time + step) <= item.endTime) {

                                //  console.log(""+new Date(time)+"----"+item.WBS_activity_startDate.value+"----"+item.WBS_activity_endDate.value)


                                //   if (!self.periodTicks[time].activities.indexOf(item.WBS_activity.value) < 1) {


                                var hours = parseInt(item["WBS_activity_durationInHours"].value);

                                var date = new Date(time);
                                var dateStr = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
                                var value = (n || 1) / days;//nbre d'heures moyen par jours
                                var persons = value / 12;// number of persons
                                if (!self.dayPeriodActivities[dateStr]) {
                                    self.dayPeriodActivities[dateStr] = { activities: [], tags: [] };
                                }
                                self.dayPeriodActivities[dateStr].activities.push(item.WBS_activity.value);
                                if (item.tags) {
                                    self.dayPeriodActivities[dateStr].tags = self.dayPeriodActivities[dateStr].tags.concat(item.tags);
                                }

                                if (!dataGroups[group].data[time]) {
                                    dataGroups[group].data[time] = { cumul: 0, activities: [] };
                                }
                                dataGroups[group].data[time].cumul += value;
                                dataGroups[group].data[time].activities.push(item.WBS_activity.value);


                            }

                        }
                    }

                });
            }


            var items = [];

            for (var group in dataGroups) {
                for (var time in dataGroups[group].data) {
                    var date = new Date(parseInt(time)).toISOString().replace("T", " ").substring(0, 10);


                    var item = dataGroups[group].data[time];
                    var obj = {};
                    obj.group = group;
                    obj.x = date;
                    obj.y = item.cumul;
                    obj.data = { activities: item.activities, date: date };
                    items.push(obj);

                }


            }
            return { items: items, groups: dataGroups };
        };


        self.drawChart = function(data) {
            self.currentData = data;
            var items = [];

            var visjsGroups = new vis.DataSet();
            var groupsArray = [];
            for (var group in data.groups) {
                groupsArray.push(data.groups[group]);
            }
            groupsArray.sort(function(a, b) {
                if (a.content > b.content) {
                    return 1;
                }
                if (a.content < b.content) {
                    return -1;
                }
                return 0;
            });
            visjsGroups.add(groupsArray);


            const container = document.getElementById("myChart");


            var options = {
                style: "bar",
                stack: true,
                barChart: { width: 40, align: "center" }, // align: left, center, right
                drawPoints: false,
                height: 300,
                dataAxis: {
                    left: { range: { min: 0 } }
                },

                legend: { left: { position: "top-left" } },
                orientation: "top"
                // clickToUse: true

            };

            if (self.graph2d) {
                self.graph2d.destroy();
            }
            // self.graph2d.items=data.items
            self.graph2d = new vis.Graph2d(container, data.items, visjsGroups, options);
            self.graph2d.addCustomTime(new Date(2026, 1, 1));
            var range = self.graph2d.getDataRange();
            TimelineAnimation.initTagGeometry(range, self.dayPeriodActivities);

            self.graph2d.on("contextmenu", function(props) {
                props.event.preventDefault();
            });


            self.graph2d.on("timechange", function(properties) {
                TimelineAnimation.currentTime = properties.time.getTime();
                var date = new Date(properties.time).toISOString().replace("T", " ").substring(0, 10);
                $("#tagsCalendarMessageDiv").html(date);
            });

            self.graph2d.on("timechanged", function(properties) {
                TimelineAnimation.currentTime = properties.time.getTime();
                self.onChart2DselectDate(properties);
            });

            self.graph2d.on("click", function(properties) {
                if (!properties) {
                    return;
                } else if (properties.what == "legend") {

                } else if (properties.what == "background") {
                    self.onChart2DselectDate(properties);
                }
            });


        };

        self.setChartTitle = function(title) {
            $("#chartTitle").html(title);
        };


        self.onChart2DselectDate = function(properties) {
            TimelineAnimation.pauseAnimateTimeLine();
            var date = new Date(properties.time).toISOString().replace("T", " ").substring(0, 10);


            var dateStr = properties.time.getFullYear() + "-" + properties.time.getMonth() + "-" + properties.time.getDate();


            var timeContent = self.dayPeriodActivities[dateStr];


            if (timeContent) {
                var activities = timeContent.activities;


                $("#tagsCalendarMessageDiv").html(date);
                var selection = [];
                var listItems = [];
                var tags = [];
                self.sparqlData.forEach(function(item) {
                    if (activities.indexOf(item["WBS_activity"].value) > -1) {

                        if (item.tags) {
                            tags = tags.concat(item.tags);
                        }
                        selection.push(item);
                        listItems.push({
                            id: item["WBS_activity"].value,
                            label: item["WBS_activity_label"].value// + " " + item["WBS_activity_startDate"].value.substring(0, 10) + " " + item["WBS_activity_endDate"].value.substring(0, 10)
                            //   label: item["WBS_activity_startDate"].value.substring(0, 10) + " " + item["WBS_activity_endDate"].value.substring(0, 10)
                        });
                    } else {

                    }


                });

                TagsGeometry.highlightTags(tags);
                Lifex_planning.draw(selection, date);

                activities.sort();

                common.array.sort(listItems, "label");
                common.fillSelectOptions("tagsCalendarItemsSelect", listItems, null, "label", "id");
            }
        };


        self.showWBSactivitiesOfJC = function(JCnumber) {
//console.log(JCnumber)
            var listItems = [];
            self.sparqlData.forEach(function(item) {
                //  console.log(item.WBS_activity_label.value)
                if (item.WBS_activity_label.value.indexOf(JCnumber) > -1) {

                    listItems.push({ id: item.WBS_activity.value, label: item.WBS_activity_label.value, startDate: item.WBS_activity_startDate.value });

                }
            });


            common.array.sort(listItems, "label");
            self.showWBSactivitiesOnGraph2D(listItems);
            common.fillSelectOptions("tagsCalendarItemsSelect", listItems, null, "label", "id");


        };
        self.showWBSactivitiesOnGraph2D = function(listItems) {

            if (self.graph2dCustomtimesIds) {
                self.graph2dCustomtimesIds.forEach(function(id) {
                    self.graph2d.removeCustomTime(id);
                });
            }

            self.graph2dCustomtimesIds = [];


            listItems.forEach(function(item) {
                var cssId = "JCTime";
                var time = item.startDate;
                var id = self.graph2d.addCustomTime(time, cssId + " " + item.label);
                self.graph2d.setCustomTimeMarker(item.label, id, true);
                self.graph2dCustomtimesIds.push(id);


            });


        };


        self.addOtherActivitiesToTimeLine = function(uri) {
            var p = uri.indexOf("DAL-");
            if (p < 0) {
                return;
            }
            var JClabel = uri.substring(p);
            var filter = "FILTER( ?JobCardExecution_label ='" + JClabel + "')";


            self.executerQuery({ filter: filter }, function(err, result) {

                if (err) {
                    return alert(err.responseText);
                }
                var data = result.results.bindings;
                if (data.length == 0) {
                    return;
                }
                var timeLinesItem = [];
                data.forEach(function(item) {

                    var startDate = item.WBS_activity_startDate.value.substring(0, 10).replace(/-/g, ".");
                    var endDate = item.WBS_activity_endDate ? item.WBS_activity_endDate.value.substring(0, 10).replace(/-/g, ".") : null;
                    var obj = {
                        id: item.WBS_activity.value,
                        content: item.WBS_activity_label.value,
                        start: startDate,
                        end: endDate,
                        group: "_",
                        className: "vis-item-JC"

                    };
                    timeLinesItem.push(obj);


                });
                // Lifex_planning.drawTimeLine(timeLinesItem, null)
                Lifex_planning.drawTimeLine(timeLinesItem, null, "JCtimeLineDiv");


            });


            //   setItems(items)
        };

        self.onSearchInput = function(word) {

        };


        self.test = function() {
            //   var x= self.graph2d.getSelection()


        };


        return self;

    }
)
();

export default DataManager;
window.DataManager = DataManager;