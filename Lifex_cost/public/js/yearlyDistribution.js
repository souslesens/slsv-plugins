import Lifex_cost_SparqlQueries from "./sparqlQueries.js";
import Charts from "./charts.js";
import Lifex_cost_FiltersWidget from "./filtersWidget.js";
import DailyDistribution from "./dailyDistribution.js";


var Lifex_cost_YearlyDistribution = (function () {
        var self = {}

       
        self.listJobCardsLifex_cost_YearlyDistribution = function () {
            var valueVarName = $("#Lifex_cost_quantityVarSelect").val()


            if(["offshoreManHours" ,"POB"].indexOf(valueVarName)>-1){
              return   Lifex_cost_DailyDistribution.listJobCardsDailyDistribution()
            }


            var splitbyVarName = $("#Lifex_cost_SplitBySelect").val()
            if (splitbyVarName) {
                splitbyVarName = Lifex_cost_JobCardController.splitByVarNamesMap[splitbyVarName].varName
            }
            
            var filter = Lifex_cost_FiltersWidget.getFilter({addJobCard:true});
            var options = {subQueries: filter.subQueries}
            $("#Lifex_cost_right_tabs").tabs("option", "active", 0);
           
            self.getPropertyLifex_cost_YearlyDistribution(valueVarName, splitbyVarName, filter, options, function (err, jobcardYearsmap) {
                if (err) {
                    return alert(err)
                }
                var columns = [{title: "Group", defaultContent: ""},
                    {title: "Jobcard", defaultContent: ""},
                    {title: "Total", defaultContent: ""},
                    {title: "NA", defaultContent: ""}
                ]

                var yearKeys = ["noYear"]
                for (var year = 2020; year < 2046; year++) {
                    columns.push({title: "" + year, defaultContent: ""});
                    yearKeys.push("" + year)
                }
                var data = []
                for (var group in jobcardYearsmap) {

                    for (var jobCard in jobcardYearsmap[group]) {
                        var total = 0
                        var obj = [group, jobCard]
                        yearKeys.forEach(function (year) {
                            var value = null;
                            if (jobcardYearsmap[group][jobCard][year]) {
                                value = jobcardYearsmap[group][jobCard][year].value
                                if (jobcardYearsmap[group][jobCard][year].capex) {
                                    value += jobcardYearsmap[group][jobCard][year].capex
                                }

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
                Lifex_cost_FiltersWidget.setTitle(null,true);
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


        self.showGlobalLifex_cost_YearlyDistribution = function (isDailyDistribution) {
           
            if(isDailyDistribution){
                return   Lifex_cost_DailyDistribution.showGlobalDailyDistribution()
            }
            var valueVarName = $("#Lifex_cost_quantityVarSelect").val();
           
            var splitbyVarName = $("#Lifex_cost_SplitBySelect").val();
            if(splitbyVarName=='Cost Type' &&  valueVarName!='CAPEX'){
                return alert('CAPEX splitBy work only with CAPEX Y axis');
            }
            

            if (splitbyVarName) {
                splitbyVarName = Lifex_cost_JobCardController.splitByVarNamesMap[splitbyVarName].varName
            }
            var filter = Lifex_cost_FiltersWidget.getFilter({addJobCard:true});
            var options = {global: true}
            /*var isDailyDistribution=false;
            if(valueVarName=='POB'|| valueVarName=='offshoreManHours'){
                isDailyDistribution=true;
            }*/
          
            self.getPropertyLifex_cost_YearlyDistribution(valueVarName, splitbyVarName, filter, options, function (err, globalLifex_cost_YearlyDistribution) {

                $("#Lifex_cost_right_tabs").tabs("option", "active", 1);
                if (err) {
                    return alert(err)
                }
                Lifex_cost_charts.drawGlobalChart2d(globalLifex_cost_YearlyDistribution,isDailyDistribution);


                var uniqueGroups = {}
                var columns = [{title: "year", defaultContent: ""}]

                //var columns = [{title: "year", defaultContent: ""}, {title: valueVarName, defaultContent: ""}]
                var yearKeys = ["noYear"]
                for (var year = 2020; year < 2046; year++) {
                    yearKeys.push("" + year)
                }
                var data = []
                var splitbyVar = $("#Lifex_cost_SplitBySelect").val()
                if(splitbyVar=='Cost Type'){
                    columns.push({title: 'phaseCost', defaultContent: ""})
                    columns.push({title: 'CAPEX', defaultContent: ""})
                }
                yearKeys.forEach(function (year) {
                    var line = ["" + year]
                    for (var group in globalLifex_cost_YearlyDistribution) {
                        if (!uniqueGroups[group] && splitbyVar!='Cost Type') {
                            uniqueGroups[group] = 1
                            columns.push({title: group, defaultContent: ""})
                        }
                        var value
                        if (globalLifex_cost_YearlyDistribution[group][year]) {
                            value = globalLifex_cost_YearlyDistribution[group][year].value
                            if (globalLifex_cost_YearlyDistribution[group][year].capex) {
                                value += globalLifex_cost_YearlyDistribution[group][year].capex
                            }
                            value = Math.round(value)
                        } else {
                            value = ""
                        }
                        line.push(value)
                        if(splitbyVar=='Cost Type' ){
                            if(globalLifex_cost_YearlyDistribution[group][year]?.capex>0){
                                line.push(globalLifex_cost_YearlyDistribution[group][year].capex.toFixed(2))
                            }else{
                                line.push('');
                            }
                        }
                    }
                    data.push(line)
                })
                if(Lifex_cost_charts.DataTable){
                    Lifex_cost_charts.DataTable.destroy();
                }

                Export.showDataTable(null, columns, data, null, {
                    paging: true,
                    divId: "Lifex_costTab_resumeDayTable"
                }, function (err, datatable) {
                    Lifex_cost_charts.DataTable=datatable;
                    $("#dataTableDivExport").on("click", "td", function () {

                    })
                });
            })
        }


        self.getPropertyLifex_cost_YearlyDistribution = function (varName, splitbyVarName, filterObj, options, callback) {
            if (!options) {
                options = {}
            }
            //   varName = "phaseCost"
            //   options.output = "TABLE"
            var sparqlResult = []
            var Lifex_cost_YearlyDistributionMap = {}
            var JobCardYearsMap = {}
            var JobCardCapexMap = {}
            var globalLifex_cost_YearlyDistribution = {}
            var sumOfValue = 0

            var valueToDistribute = null;

            Lifex_cost_YearlyDistributionMap["NA"] = {}
            for (var year = 2021; year < 2046; year++) {
                Lifex_cost_YearlyDistributionMap["" + year] = {}
            }


            async.series([
                    //executeQuery
                    function (callbackSeries) {


                        if (varName == "CAPEX") {
                            filterObj.filter += "?JobCard <http://data.total/resource/tsf/dalia-lifex-costs/CPYcosts> ?JobCard_CPYcosts."
                            filterObj.filter += "?JobCard <http://data.total/resource/tsf/dalia-lifex-costs/contingenciesCost> ?JobCard_contingenciesCost."
                            valueToDistribute = varName;
                            varName = "phaseCost"
                        }
                        /*  if (varName == "CPYcosts") {
                              filterObj.filter += "?JobCard <http://data.total/resource/tsf/dalia-lifex-costs/CPYcosts> ?JobCard_CPYcosts."
                              valueToDistribute=varName;
                              varName="phaseCost"
                          }

                          if (varName == "contingenciesCost") {
                              filterObj.filter += "?JobCard <http://data.total/resource/tsf/dalia-lifex-costs/contingenciesCost> ?JobCard_contingenciesCost."
                          }*/


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
                    // make Lifex_cost_YearlyDistributionMap
                    function (callbackSeries) {
                        var error = null;

                        sparqlResult.forEach(function (item) {
                            var value = 0;
                            var jobcardId = item.JobCard.value
                            var jobcardLabel = item.JobCard_label.value
                            if (item[varName]) {
                                if (item[varName].datatype.endsWith("float")) {
                                    value = parseFloat(item[varName].value)
                                } else if (item[varName].datatype.endsWith("int")) {
                                    value = parseInt(item[varName].value)
                                } else {
                                    return callback("wrong number" + JSON.stringify(item))
                                }

                            }
                            if (valueToDistribute == "CAPEX") {
                                JobCardCapexMap[jobcardLabel] = parseFloat(item.JobCard_CPYcosts.value) + parseFloat(item.JobCard_contingenciesCost.value)
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
                                itemDistrib = self.distributeValuesYearly(dateBounds)

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
                            for (var year in itemDistrib) {


                                if (!Lifex_cost_YearlyDistributionMap[year]) {
                                    Lifex_cost_YearlyDistributionMap[year] = {}
                                }
                                if (!Lifex_cost_YearlyDistributionMap[year][jobcardLabel]) {
                                    Lifex_cost_YearlyDistributionMap[year][jobcardLabel] = {}
                                }
                                if (!Lifex_cost_YearlyDistributionMap[year][jobcardLabel][dateBounds.group]) {
                                    Lifex_cost_YearlyDistributionMap[year][jobcardLabel][dateBounds.group] = {
                                        value: 0,
                                        ratio: 0
                                    }
                                }

                                Lifex_cost_YearlyDistributionMap[year][jobcardLabel][dateBounds.group].value += itemDistrib[year].value
                                Lifex_cost_YearlyDistributionMap[year][jobcardLabel][dateBounds.group].ratio += itemDistrib[year].ratio

                                sumOfValue += itemDistrib[year].value

                            }


                        })
                        callbackSeries(error)
                    },


                    //buld JobCardYearsMap
                    function (callbackSeries) {
                        for (var year in Lifex_cost_YearlyDistributionMap) {

                            var totalValue = 0
                            for (var jobCard in Lifex_cost_YearlyDistributionMap[year]) {
                                for (var group in Lifex_cost_YearlyDistributionMap[year][jobCard]) {
                                    if (!JobCardYearsMap[group]) {
                                        JobCardYearsMap[group] = {}
                                    }
                                    if (!JobCardYearsMap[group][jobCard]) {
                                        JobCardYearsMap[group][jobCard] = {}
                                    }
                                    JobCardYearsMap[group][jobCard][year] = Lifex_cost_YearlyDistributionMap[year][jobCard][group]
                                    if (!JobCardYearsMap[group][jobCard].totalValue) {
                                        JobCardYearsMap[group][jobCard].totalValue = 0
                                    }
                                    JobCardYearsMap[group][jobCard].totalValue += Lifex_cost_YearlyDistributionMap[year][jobCard][group].value

                                }
                            }
                        }
                        callbackSeries();
                    },
                    //calculate Capex
                    function (callbackSeries) {
                        if (valueToDistribute != "CAPEX") {
                            return callbackSeries()
                        }

                        for (var group in JobCardYearsMap) {
                            for (var jobCard in JobCardYearsMap[group]) {

                                var jobcardYearsMap = self.distributeCapex(JobCardCapexMap[jobCard], JobCardYearsMap[group][jobCard])

                                for (var year in JobCardYearsMap[group][jobCard]) {
                                    if (jobcardYearsMap[year] && jobcardYearsMap[year].yearlyCapex) {
                                        JobCardYearsMap[group][jobCard][year].capex = jobcardYearsMap[year].yearlyCapex;
                                        Lifex_cost_YearlyDistributionMap[year][jobCard][group].capex = jobcardYearsMap[year].yearlyCapex;
                                    } else {
                                        var x = 3
                                    }
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

                        for (var year in Lifex_cost_YearlyDistributionMap) {
                            for (var jobCard in Lifex_cost_YearlyDistributionMap[year]) {
                                for (var group in Lifex_cost_YearlyDistributionMap[year][jobCard]) {
                                    if (!globalLifex_cost_YearlyDistribution[group]) {
                                        globalLifex_cost_YearlyDistribution[group] = {}
                                    }
                                    if (!globalLifex_cost_YearlyDistribution[group][year]) {
                                        globalLifex_cost_YearlyDistribution[group][year] = {value: 0, capex: 0}
                                    }
                                    globalLifex_cost_YearlyDistribution[group][year].value += Lifex_cost_YearlyDistributionMap[year][jobCard][group].value || 0
                                    globalLifex_cost_YearlyDistribution[group][year].capex += Lifex_cost_YearlyDistributionMap[year][jobCard][group].capex || 0
                                }
                            }
                        }

                        return callbackSeries();
                    },


                ], function (err) {

                    if (options.table) {
                        return callback(null, null)
                    } else if (options.global) {
                        Lifex_cost_charts.currentDateDistribution=Lifex_cost_YearlyDistributionMap
                        return callback(null, globalLifex_cost_YearlyDistribution)
                    } else {
                        return callback(null, JobCardYearsMap)
                    }


                }
            )


        }


        self.distributeValuesYearly = function (dateBounds) {


            if (!Array.isArray(dateBounds)) {
                dateBounds = [dateBounds]
            }
            var yearsMap = {}
            dateBounds.forEach(function (dateBound) {
                if (!dateBound.endDate || dateBound.startdDate) {
                    return;
                }

                var bulkDuration = dateBound.endDate - dateBound.startDate
                if (bulkDuration < 86400000) {// la duree est au moins 1 jour
                    bulkDuration = 86400000
                }
                var currentYear = dateBound.startDate.getFullYear()
                var endYear = dateBound.endDate.getFullYear()
                var currentStartDate = dateBound.startDate
                var currentEndDate = dateBound.endDate;
                if (endYear > currentYear) {
                    currentEndDate = new Date(currentYear, 11, 31)
                }
                do {
                    var durationInYear = currentEndDate - currentStartDate
                    if (durationInYear == 0)//minimum 1 jour
                    {
                        durationInYear = 86400000
                    }
                    yearsMap[currentYear] = {
                        group: dateBound.group,
                        duration: durationInYear,
                        rawValue: dateBound.value || 0
                    };


                    currentStartDate = new Date(currentYear, 11, 31)
                    currentYear += 1
                    if (currentYear < endYear) {
                        currentEndDate = new Date(currentYear, 11, 31)
                    } else {
                        currentEndDate = dateBound.endDate
                    }
                } while (currentStartDate < dateBound.endDate)


                for (var year in yearsMap) {
                    var yearObj = yearsMap[year]
                    var ratio = yearObj.duration / bulkDuration
                    if (isNaN(ratio) || isNaN(yearObj.rawValue)) {
                        var x = 3
                    } else {
                        var value = yearObj.rawValue * ratio

                        /*   if (dateBound.valueToDistribute) {
                               value += dateBound.valueToDistribute
                           }*/

                        yearsMap[year].value = value
                        yearsMap[year].ratio = ratio
                    }
                }

            })

            return yearsMap;


        }

        self.distributeCapex = function (jobcardCapex, jobcardYearsMap) {
            var totalValue = 0
            var yearlyCapexMap = {}
            for (var year in jobcardYearsMap) {
                if (jobcardYearsMap[year].value) {
                    totalValue += jobcardYearsMap[year].value
                }
            }

            for (var year in jobcardYearsMap) {
                if (jobcardYearsMap[year].value) {
                    yearlyCapexMap[year] = {yearlyCapex: jobcardCapex * (jobcardYearsMap[year].value / totalValue)}
                }
            }
            return yearlyCapexMap
        }



      











        return self;
    }
)
()
export default Lifex_cost_YearlyDistribution;
window.Lifex_cost_YearlyDistribution = Lifex_cost_YearlyDistribution

/*
Lifex_cost_YearlyDistribution.distributeValuesYearly({
    startDate:new Date(2024,5,12),
    endDate:new Date(2026,2,03)
})*/