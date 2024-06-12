//import SavedQueriesWidget from "../../../../public/vocables/modules/uiWidgets/savedQueriesWidget.js";


//import Sparql_proxy from "../../../../public/vocables/modules/sparqlProxies/sparql_proxy.js";
//import Lifex_planning from "./main.js";


var DataManager = (function() {
    var self = {};
    self.data = [];
    self.loadQuery = function(queryId) {

        var url = Config.sources[Lifex_planning.currentSource].sparql_server.url + "?format=json&query=";
        MainController.UI.message("loading data");

        var query = "PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  where {?WBS_activity <http://rds.posccaesar.org/ontology/lis14/rdl/occursRelativeTo> ?JobCardExecution.\n" +
            "\n" +
            "\n" +
            " ?WBS_activity  rdf:type <http://data.total/resource/tsf/PRIMAVERA_TEST/WBS_activity>.  ?JobCardExecution  rdf:type <http://data.total/resource/tsf/dalia-lifex1/JobCardExecution>.\n" +
            " OPTIONAL  {?WBS_activity <http://www.w3.org/2000/01/rdf-schema#label> ?WBS_activity_label.}\n" +
            " OPTIONAL  {?WBS_activity <http://purl.org/dc/terms/title> ?WBS_activity_title.}\n" +
            " OPTIONAL  {?WBS_activity <http://data.total/resource/tsf/PRIMAVERA_TEST/startDate> ?WBS_activity_startDate.}\n" +
            " OPTIONAL  {?WBS_activity <http://data.total/resource/tsf/PRIMAVERA_TEST/endDate> ?WBS_activity_endDate.}\n" +
            " OPTIONAL  {?WBS_activity <http://data.total/resource/tsf/PRIMAVERA_TEST/durationInHours> ?WBS_activity_durationInHours.}\n" +
            " OPTIONAL  {?JobCardExecution <http://data.total/resource/tsf/dalia-lifex1/startDate> ?JobCardExecution_startDate.}\n" +
            " OPTIONAL  {?JobCardExecution <http://data.total/resource/tsf/dalia-lifex1/endDate> ?JobCardExecution_endDate.}\n" +
            " OPTIONAL  {?JobCardExecution <http://www.w3.org/2000/01/rdf-schema#label> ?JobCardExecution_label.}\n" +
            "}  limit 10000";


        var queryX = "PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex1/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  FROM   <http://data.total/resource/tsf/PRIMAVERA_TEST/>  where {?WBS_activity <http://rds.posccaesar.org/ontology/lis14/rdl/occursRelativeTo> ?JobCardExecution.\n" +
            "?Discipline <http://rds.posccaesar.org/ontology/lis14/rdl/realizedIn> ?JobCardExecution.\n" +
            "\n" +
            "\n" +
            " ?WBS_activity  rdf:type <http://data.total/resource/tsf/PRIMAVERA_TEST/WBS_activity>.  ?JobCardExecution  rdf:type <http://data.total/resource/tsf/dalia-lifex1/JobCardExecution>. ?Discipline  rdf:type <http://data.total/resource/tsf/dalia-lifex1/Discipline>. \n" +
            " OPTIONAL  {?WBS_activity <http://www.w3.org/2000/01/rdf-schema#label> ?WBS_activity_label.}\n" +
            " OPTIONAL  {?WBS_activity <http://data.total/resource/tsf/PRIMAVERA_TEST/startDate> ?WBS_activity_startDate.}\n" +
            " OPTIONAL  {?WBS_activity <http://data.total/resource/tsf/PRIMAVERA_TEST/endDate> ?WBS_activity_endDate.}\n" +
            " OPTIONAL  {?JobCardExecution <http://www.w3.org/2000/01/rdf-schema#label> ?JobCardExecution_label.}\n" +
            " OPTIONAL  {?JobCardExecution <http://www.w3.org/2004/02/skos/core#prefLabel> ?JobCardExecution_prefLabel.}\n" +
            " OPTIONAL  {?Discipline <http://www.w3.org/2000/01/rdf-schema#label> ?Discipline_label.}\n" +
            "}  limit 10000";

        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: Lifex_planning.currentSource }, function(err, result) {
            if (err) {
                return callbackSeries(err);
            }

            MainController.UI.message("", true);
            self.sparqlData = result.results.bindings;
            //  Lifex_planning.draw(self.sparqlData);
            //  Lifex_planning.drawSparqlResultTimeLine({ data: self.data });
            self.chartData = self.getCumulatedValuesBydate("WBS_activity_durationInHours", "sum", null, null);
            self.drawChart(self.chartData);


        });


    };

    self.filterChartData = function() {
        $("#Lifex_planning_jstreeFilterDiv");
    };

    self.writeData = function() {


    };


    self.writeData = function() {


    };
/*self.groupLabelsMap = {

        "/ENG": "1-Detail Engineering",
        "/PR": "2-Procurement",
        "/PF": "3-Prefabrication ",
        "/CNT": " 4-Offshore Construction",
        "/PRECOM": "5-Offshore Pre-Commissioning",
        "/COM": "6-Offshore Commissioning"


    };*/
    self.groupLabelsMap = {

        "/ENG": {label:"1-Detail Engineering",color:"#ddd"},
        "/PR":  {label:"2-Procurement",color:"#ddd"},
        "/PF":  {label:"3-Prefabrication ",color:"#ddd"},
        "/CNT":  {label:"4-Offshore Construction",color:"#ddd"},
        "/PRECOM":  {label:"5-Offshore Pre-Commissioning",color:"#ddd"},
        "/COM":  {label:"6-Offshore Commissioning",color:"#ddd"},


    };

    self.getGroups = function() {
        var dataGroups = {};

        for (var groupId in self.groupLabelsMap) {
            var label = self.groupLabelsMap[groupId].label;
            dataGroups[groupId] = { id: groupId, content: label , data:{}};
        }


        return dataGroups;


    };

    self.getCumulatedValuesBydate = function(quantityName, groupFn, afterDate, beforeDate) {

        var dataGroups = self.getGroups();
        var startDateVarName = "WBS_activity_startDate";//$("#tagsCalendar_startDateSelect").val();
        var endDateVarName = "WBS_activity_endDate";// $("#tagsCalendar_endDateSelect").val();
        var labelVarName = $("#tagsCalendar_labelSelect").val();
        var idVarName = $("#tagsCalendar_idSelect").val();

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
            var group = item.WBS_activity.value.substring(item.WBS_activity.value.lastIndexOf("/")).split("-")[0];


            item.group = group;
            itemsInDatesRange.push(item);
        });


        self.periodTicks = {};
        self.dayPeriodActivities = {};
        var step = 1000 * 60 * 60 * 24;//*7;

        var time = minRangeTime - 1;
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
                            var dateStr = date.getYear() + "-" + date.getMonth() + "-" + date.getDate();
                            var value = (n || 1) / days;//nbre d'heures moyen par jours
                            var persons = value / 12;// number of persons
                            if (!self.dayPeriodActivities[dateStr]) {
                                self.dayPeriodActivities[dateStr] = { activities: [] };
                            }
                            self.dayPeriodActivities[dateStr].activities.push(item.WBS_activity.value);

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
        for (var group in data.groups) {
            visjsGroups.add(data.groups[group]);
        }


        const container = document.getElementById("myChart");

        var dataset = new vis.DataSet(items);
        var options = {
            style: "bar",
            stack: true,
            barChart: { width: 1, align: "center" }, // align: left, center, right
            drawPoints: false,
            dataAxis: {
                //  icons:true
            },
            legend: { left: { position: "top-left" } },
            orientation: "top",
            clickToUse: true
            //   start: '2024-06-10',
            //  end: '2030-06-18'
        };
        self.graph2d = new vis.Graph2d(container, data.items, visjsGroups, options);

        self.graph2d.on("contextmenu", function(props) {
            props.event.preventDefault();
        });
        self.graph2d.on("click", function(properties) {
            if (!properties) {
                return;
            } else if (properties.what == "legend") {

            } else if (properties.what == "background") {
                var date = new Date(properties.time).toISOString().replace("T", " ").substring(0, 10);


                var dateStr = properties.time.getYear() + "-" + properties.time.getMonth() + "-" + properties.time.getDate();


                var timeContent = self.dayPeriodActivities[dateStr];


                if (timeContent) {
                    var activities = timeContent.activities;


                    $("#tagsCalendarMessageDiv").html(date);
                    var selection = [];
                    var listItems = [];
                    self.sparqlData.forEach(function(item) {
                        if (activities.indexOf(item["WBS_activity"].value) > -1) {

                            selection.push(item);

                            listItems.push({
                                id: item["WBS_activity"].value,
                                label: item["WBS_activity_label"].value// + " " + item["WBS_activity_startDate"].value.substring(0, 10) + " " + item["WBS_activity_endDate"].value.substring(0, 10)
                                //   label: item["WBS_activity_startDate"].value.substring(0, 10) + " " + item["WBS_activity_endDate"].value.substring(0, 10)
                            });
                        }else{
                            var x=3
                        }


                    });
                    Lifex_planning.draw(selection, date);

                    activities.sort();


                    common.fillSelectOptions("tagsCalendarItemsSelect", listItems, null, "label", "id");
                }
            }


        });

    };


    return self;

})
();

export default DataManager;
window.DataManager = DataManager;