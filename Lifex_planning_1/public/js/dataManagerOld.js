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
            " OPTIONAL  {?Discipline <http://www.w3.org/2000/01/rdf-schema#label> ?Discipline_label.}\n" +
            " OPTIONAL  {?WBS_activity <http://data.total/resource/tsf/PRIMAVERA_TEST/treePath> ?WBS_activity_treePath.}\n" +
            " OPTIONAL  {?WBS_activity <http://data.total/resource/tsf/PRIMAVERA_TEST/durationInHours> ?WBS_activity_durationInHours.}\n" +
            " OPTIONAL  {?JobCardExecution <http://www.w3.org/2000/01/rdf-schema#label> ?JobCardExecution_label.}\n" +
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


            return;


        });


    };

    self.writeData = function() {


    };


    self.writeData = function() {


    };


    self.getCumulatedValuesBydate = function(quantityName, groupFn, afterDate, beforeDate) {


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

            itemsInDatesRange.push(item);
        });


        var periodTicks = {};
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

            periodTicks[time] = obj;


            time += step;
        }
        while (time <= maxRangeTime);

        var dayTime = (1000 * 60 * 60 * 24);

        var groups = {};
        itemsInDatesRange.forEach(function(item) {
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


            var days = (item.endTime - item.startTime) / dayTime;
            if (days == 0) {
                days = 1;
            }
            //  n = n / (days * 12);


            for (var time in periodTicks) {
                time = parseInt(time);
                if (time >= item.startTime) {

                    // console.log((time + step) +"__"+ item.endTime)
                    if ((time + step) <= item.endTime) {

                        //  console.log(""+new Date(time)+"----"+item.WBS_activity_startDate.value+"----"+item.WBS_activity_endDate.value)


                        if (!periodTicks[time].activities.indexOf(item.WBS_activity.value) < 1) {

                            var hours = parseInt(item["WBS_activity_durationInHours"].value);
                            var value = (n || 1) / days;//nbre d'heures moyen par jours
                            var persons = value / 12;// number of persons
                            periodTicks[time].cumul += persons;


                            periodTicks[time].activities.push(item.WBS_activity.value);
                        }
                    }

                }
            }

        });

        var data = [];
        var uniqueTimes = {};
        for (var time in periodTicks) {
            /*     periodTicks[time].activities.forEach(function(activity){
             var group=activity.substring(activity.lastIndexOf("/")).split("-")[0];
               if(!groups[group]){
                   groups[group]=[]
               }
               if(!uniqueTimes[time]) {
                   uniqueTimes[time]=1
                   groups[group].push(periodTicks[time])
               }

               })*/
            data.push(periodTicks[time]);
        }

        return data;
    };


    self.drawChart = function(data) {
        self.currentData = data;
        var myChartData = [];
        var myChartDataCount = [];

        data.forEach(function(item, index) {

            var strDate = item.start.toISOString().replace("T", " ").substring(0, 19);
            myChartData.push({
                x: strDate,//'2021-11-06 23:39:30',
                y: item.cumul
            });
            myChartDataCount.push({
                x: strDate,//'2021-11-06 23:39:30',
                y: item.activities.length
            });

        });


        const ctx = document.getElementById("myChart");

        let chart = new Chart(ctx, {
            type: "line",
            data: {
                datasets: [{
                    label: "cumul",
                    data: myChartData,
                    fill: false,
                    borderColor: "rgb(253,172,0)"

                },
                    {
                        label: "count",
                        data: myChartDataCount,
                        borderColor: "rgb(137,207,213)"


                    }]
            },
            options: {
                scales: {
                    x: {
                        type: "time",
                        time: {
                            unit: "month"
                        }
                    }
                }
            }
        });
        const canvas = document.getElementById("myChart");
        canvas.onclick = (evt) => {

            const res = chart.getElementsAtEventForMode(
                evt,
                "point",
                { intersect: true },
                true
            );
            var itemTime = self.chartData[res[0].index];
            var activities = itemTime.activities;
            var time = itemTime.start.getTime();


            $("#tagsCalendarMessageDiv").html(itemTime.start);
            var selection = [];
            var listItems = [];
            self.sparqlData.forEach(function(item) {
                if (activities.indexOf(item["WBS_activity"].value) > -1) {
                    if (time < item.startTime || time > item.endTime) {
                        var x = 3;
                    }
                    selection.push(item);

                    listItems.push({
                        id: item["WBS_activity"].value,
                        label: item["WBS_activity_label"].value// + " " + item["WBS_activity_startDate"].value.substring(0, 10) + " " + item["WBS_activity_endDate"].value.substring(0, 10)
                        //   label: item["WBS_activity_startDate"].value.substring(0, 10) + " " + item["WBS_activity_endDate"].value.substring(0, 10)
                    });
                }


            });
            Lifex_planning.draw(selection, itemTime.start);

            activities.sort();


            common.fillSelectOptions("tagsCalendarItemsSelect", listItems, null, "label", "id");


        };

    };


    return self;

})
();

export default DataManager;
window.DataManager = DataManager;