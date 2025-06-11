import Lifex_cost_SparqlQueries from "./sparqlQueries.js";
import Charts from "./charts.js";
import Lifex_cost_FiltersWidget from "./filtersWidget.js";


var Lifex_cost_DailyDistribution = (function () {
        var self = {}


        self.listJobCardsDailyDistribution = function () {
            var valueVarName = $("#Lifex_cost_quantityVarSelect").val()
            var splitbyVarName = $("#Lifex_cost_SplitBySelect").val()
            if (splitbyVarName) {
                splitbyVarName = Lifex_cost_JobCardController.splitByVarNamesMap[splitbyVarName].varName
            }

            var filter = Lifex_cost_FiltersWidget.getFilter({phase: true});
            var options = {subQueries: filter.subQueries}
            $("#Lifex_cost_right_tabs").tabs("option", "active", 0);
            self.getPropertyDailyDistribution(valueVarName, splitbyVarName, filter, options, function (err, jobcardYearsmap) {
                if (err) {
                    return alert(err)
                }
                var columns = [{title: "Group", defaultContent: ""},
                    {title: "Jobcard", defaultContent: ""},
                    {title: "Total", defaultContent: ""},
                    {title: "NA", defaultContent: ""}
                ]

                var dayKeys = ["noYear"]
                for (var day = 2020; day < 2046; day++) {
                    columns.push({title: "" + day, defaultContent: ""});
                    dayKeys.push("" + day)
                }
                var data = []
                for (var group in jobcardYearsmap) {

                    for (var jobCard in jobcardYearsmap[group]) {
                        var total = 0
                        var obj = [group, jobCard]
                        dayKeys.forEach(function (day) {
                            var value = null;
                            if (jobcardYearsmap[group][jobCard][day]) {
                                value = jobcardYearsmap[group][jobCard][day].value


                                obj.push(value || "")
                            } else {
                                obj.push("");
                            }
                            if (value) {
                                total += value
                            }
                        })
                        obj.splice(2, 0, total)
                        data.push(obj)
                    }
                }

                Export.showDataTable(null, columns, data, null, {
                    paging: true,
                    divId: Lifex_cost_JobCardController.datatableDivId
                }, function (err, datatable) {
                    Lifex_cost_charts.DataTable=datatable;
                    $("#dataTableDivExport").on("click", "td", function () {
                        var table = $("#dataTableDivExport").DataTable();
                        var index = table.cell(this).index();
                        var row = table.row(this).data();
                        var column = table.cell(this).column().data();
                        var jobCardLabel = table.cell(this).data();

                        Lifex_cost_JobCardController.fillDetailsForm(jobCardLabel);

                    })
                })
            })
        }


        self.showGlobalDailyDistribution = function () {
            var valueVarName = $("#Lifex_cost_quantityVarSelect_daily").val();
            var splitbyVarName = $("#Lifex_cost_SplitBySelect_daily").val();
            if (splitbyVarName) {
                splitbyVarName = Lifex_cost_JobCardController.splitByVarNamesMap[splitbyVarName].varName
            }
            var filter = Lifex_cost_FiltersWidget.getFilter({phase: true});
            var options = {global: true}
           
            self.getPropertyDailyDistribution(valueVarName, splitbyVarName, filter, options, function (err, globalDailyDistribution) {

                $("#Lifex_cost_right_tabs").tabs("option", "active", 1);
                if (err) {
                    return alert(err)
                }
                Lifex_cost_charts.drawGlobalChart2d(globalDailyDistribution,true);


                var uniqueGroups = {}
                var columns = [{title: "day", defaultContent: ""}]

                var columns = [{title: "day", defaultContent: ""}, {title: valueVarName, defaultContent: ""}]
                var dayKeys = ["noYear"]
                for (var day = 2020; day < 2046; day++) {
                    dayKeys.push("" + day)
                }
                var data = []
               

                dayKeys.forEach(function (day) {
                    var line = ["" + day]
                    for (var group in globalDailyDistribution) {
                        if (!uniqueGroups[group] && splitbyVarName!='Cost Type') {
                            uniqueGroups[group] = 1
                            columns.push({title: group, defaultContent: ""})
                        }
                        var value
                        if (globalDailyDistribution[group][day]) {
                            value = globalDailyDistribution[group][day].value

                            value = Math.round(value)
                        } else {
                            value = ""
                        }
                        line.push(value)
                        
                        
                    }
                    data.push(line)
                })


                Export.showDataTable(null, columns, data, null, {
                    paging: true,
                    divId: Lifex_cost_JobCardController.datatableDivId
                }, function (err, datatable) {
                    Lifex_cost_charts.DataTable=datatable;
                    $("#dataTableDivExport").on("click", "td", function () {

                    })
                })
            })
        }


        self.getPropertyDailyDistribution = function (varName, splitbyVarName, filterObj, options, callback) {
            if (!options) {
                options = {}
            }
            //   varName = "phaseCost"
            //   options.output = "TABLE"
            var sparqlResult = []
            var DailyDistributionMap = {}
            var JobCardYearsMap = {}
            var JobCardCapexMap = {}
            var globalDailyDistribution = {}
            var sumOfValue = 0

            var valueToDistribute = null;


            async.series([
                    //executeQuery
                    function (callbackSeries) {


                        if (splitbyVarName == "Discipline_label" && !filterObj.filter.includes('Discipline')) {
                            filterObj.filter += "   ?Discipline <http://rds.posccaesar.org/ontology/lis14/rdl/realizedIn> ?JobCard." +
                                " ?Discipline rdfs:label ?Discipline_label."

                        }


                        var phasePropertyUri = null;

                        var filter = ""// "FILTER ?(regex(?Jobcard_label,'1731'))"
                        Lifex_cost_SparqlQueries.executeJobcardPhaseInfosQuery(phasePropertyUri, {
                            filter: filter,
                            filterObj: filterObj
                        }, function (err, result) {
                            if (err) {
                                callbackSeries(err)
                            }
                            sparqlResult = result.results.bindings
                            callbackSeries()
                        })


                    },
                    // make DailyDistributionMap
                    function (callbackSeries) {
                        var error = null;

                        sparqlResult.forEach(function (item) {
                            var value = 0;
                            var jobcardId = item.JobCard.value
                            var jobcardLabel = item.JobCard_label.value
                            var varName2 = Lifex_cost_JobCardController.quantityVarNamesMap[varName].varName
                            if (item[varName2]) {
                                if (item[varName2].datatype.endsWith("float")) {
                                    value = parseFloat(item[varName2].value)
                                } else if (item[varName2].datatype.endsWith("int")) {
                                    value = parseInt(item[varName2].value)
                                } else {
                                    return callback("wrong number" + JSON.stringify(item))
                                }

                            }


                            var itemDistrib = {}
                            var dateBounds = {}
                            if (item.startDate && item.endDate) {
                                if (jobcardLabel.indexOf("381") > -1) {
                                    var x = 3
                                }
                                dateBounds = {
                                    startDate: new Date(item.startDate.value),
                                    endDate: new Date(item.endDate.value),
                                    value: value,

                                }
                                itemDistrib = self.distributeValuesDaily(dateBounds)

                            } else {
                                itemDistrib = {["noYear"]: {value: value}}
                            }

                            if (splitbyVarName) {
                                if (item[splitbyVarName]) {
                                    dateBounds.group = item[splitbyVarName].value
                                } else {
                                    dateBounds.group = "NoGroup"
                                }
                            } else {
                                dateBounds.group = "NoGroup"
                            }

                            if (jobcardLabel.indexOf("381") > -1) {
                                var x = 3
                            }
                            for (var day in itemDistrib) {


                                if (!DailyDistributionMap[day]) {
                                    DailyDistributionMap[day] = {}
                                }
                                if (!DailyDistributionMap[day][jobcardLabel]) {
                                    DailyDistributionMap[day][jobcardLabel] = {}
                                }
                                if (!DailyDistributionMap[day][jobcardLabel][dateBounds.group]) {
                                    DailyDistributionMap[day][jobcardLabel][dateBounds.group] = {
                                        value: 0,
                                        ratio: 0
                                    }
                                }

                                DailyDistributionMap[day][jobcardLabel][dateBounds.group].value += itemDistrib[day].value
                                DailyDistributionMap[day][jobcardLabel][dateBounds.group].ratio += itemDistrib[day].ratio

                                sumOfValue += itemDistrib[day].value

                            }


                        })
                        callbackSeries(error)
                    },


                    //buld JobCardYearsMap
                    function (callbackSeries) {
                        for (var day in DailyDistributionMap) {

                            var totalValue = 0
                            for (var jobCard in DailyDistributionMap[day]) {
                                for (var group in DailyDistributionMap[day][jobCard]) {
                                    if (!JobCardYearsMap[group]) {
                                        JobCardYearsMap[group] = {}
                                    }
                                    if (!JobCardYearsMap[group][jobCard]) {
                                        JobCardYearsMap[group][jobCard] = {}
                                    }
                                    JobCardYearsMap[group][jobCard][day] = DailyDistributionMap[day][jobCard][group]
                                    if (!JobCardYearsMap[group][jobCard].totalValue) {
                                        JobCardYearsMap[group][jobCard].totalValue = 0
                                    }
                                    JobCardYearsMap[group][jobCard].totalValue += DailyDistributionMap[day][jobCard][group].value

                                }
                            }
                        }
                        callbackSeries();
                    },


                    //build global distibution
                    function (callbackSeries) {
                        if (!options.global) {
                            return callbackSeries();
                        }

                        for (var day in DailyDistributionMap) {
                            for (var jobCard in DailyDistributionMap[day]) {
                                for (var group in DailyDistributionMap[day][jobCard]) {
                                    if (!globalDailyDistribution[group]) {
                                        globalDailyDistribution[group] = {}
                                    }
                                    if (!globalDailyDistribution[group][day]) {
                                        globalDailyDistribution[group][day]={value:0}
                                    }

                                    globalDailyDistribution[group][day].value += DailyDistributionMap[day][jobCard][group].value || 0

                                }
                            }
                        }

                        return callbackSeries();
                    },


                ], function (err) {

                    if (options.table) {
                        return callback(null, null)
                    } else if (options.global) {
                        Lifex_cost_charts.currentDateDistribution=DailyDistributionMap;
                        return callback(null, globalDailyDistribution)
                    } else {
                        return callback(null, JobCardYearsMap)
                    }


                }
            )


        }


        self.distributeValuesDaily = function (dateBounds) {


            if (!Array.isArray(dateBounds)) {
                dateBounds = [dateBounds]
            }

            var daylyDistrib = {}
            dateBounds.forEach(function (dateBound) {
                if (!dateBound.endDate || dateBound.startdDate) {
                    return;
                }

                var bulkDuration = dateBound.endDate - dateBound.startDate
                var dayDuration = 1000 * 60 * 60 * 24
                if (bulkDuration < dayDuration) {// la duree est au moins 1 jour
                    bulkDuration = dayDuration
                }

                var startDate = dateBound.startDate.setHours(0, 0, 0);
                var endDate = dateBound.endDate.setHours(23, 59, 59);

                var durationInDays = (endDate - startDate)
                var currentTime = startDate

                var nDays = Math.round(durationInDays / dayDuration)


                for (var i = 0; i < nDays; i++) {
                    daylyDistrib["" + currentTime] = {value: dateBound.value / nDays};
                    currentTime = currentTime + dayDuration
                }
            })
            return daylyDistrib
        }


        return self;
    }
)
()
export default Lifex_cost_DailyDistribution;
window.Lifex_cost_DailyDistribution = Lifex_cost_DailyDistribution

/*
Lifex_cost_DailyDistribution.distributeValuesDaily({
    startDate:new Date(2024,5,12),
    endDate:new Date(2026,2,03)
})*/