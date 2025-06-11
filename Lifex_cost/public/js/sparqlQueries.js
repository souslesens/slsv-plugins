import Lifex_cost_FiltersWidget from "./filtersWidget.js";
import Lifex_cost_HistoryManager from "./historyManager.js";

var Lifex_cost_SparqlQueries = (function () {
    var self = {}



    self.executeJobcardListQuery = function (filter, options, callback) {
        if (!options) {
            options = {};
        }

        UI.message("loading data");

        var query = "PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> Select distinct *   FROM   <http://data.total/resource/tsf/dalia-lifex-costs/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>  where {\n" +

            "?JobCard rdf:type <http://data.total/resource/tsf/dalia-lifex-costs/JobCard>.   {?JobCard <http://www.w3.org/2000/01/rdf-schema#label> ?JobCard_label.}\n" +
            
            " OPTIONAL  {?JobCard <http://data.total/resource/tsf/dalia-lifex-costs/CAPEX> ?JobCard_CAPEX.}\n" +
            " OPTIONAL  {?JobCard <http://data.total/resource/tsf/dalia-lifex-costs/CPYcosts> ?JobCard_CPYcosts.}\n" +
            " OPTIONAL  {?JobCard <http://data.total/resource/tsf/dalia-lifex-costs/contingenciesCost> ?JobCard_contingenciesCost.}\n"

            /* `OPTIONAL{?Discipline <http://rds.posccaesar.org/ontology/lis14/rdl/realizedIn> ?JobCard.
            ?Discipline rdf:type <http://rds.posccaesar.org/ontology/lis14/rdl/Role>.
            ?Discipline rdfs:label ?Discipline_label.}`*/

        if (filter) {
            query += filter;
        }
        if (options.subQueries) {
            options.subQueries.forEach(function (subQuery) {
                query += "\n{ SELECT * WHERE{" + subQuery + "}}";
            });

        }
        query += " }  limit 10000";
        var url = Config.sources[Lifex_cost.currentSource].sparql_server.url + "?format=json&query=";
        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: Lifex_cost.currentSource}, function (err, result) {
            if (err) {
                return callback(err);
            }



            UI.message("", true);
            result.results.bindings= Lifex_cost_HistoryManager.restoreTripleBindingsAtHistoryDate( result.results.bindings)

            callback(null, result);
        });
    };


    self.executeJobcardPhaseInfosQuery = function (phasePropertyUri, options, callback) {
        if (!options) {
            options = {}
        }
        var query = "PREFIX owl: <http://www.w3.org/2002/07/owl#>\n" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
            "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
            "Select distinct *  FROM   <http://data.total/resource/tsf/dalia-lifex-costs/>  FROM   <http://rds.posccaesar.org/ontology/lis14/ont/core>   where {\n" +
            "?phase <http://rds.posccaesar.org/ontology/lis14/rdl/activityPartOf> ?JobCard." +
            "   ?phase rdf:type ?phaseType.?phaseType rdfs:label ?phaseType_label." +
            "   ?JobCard <http://www.w3.org/2000/01/rdf-schema#label> ?JobCard_label." +
          //  "    OPTIONAL{?Discipline <http://rds.posccaesar.org/ontology/lis14/rdl/realizedIn> ?JobCard." +
            "    OPTIONAL  {?phase <http://data.total/resource/tsf/dalia-lifex-costs/startDate> ?startDate.}\n" +
            "    OPTIONAL  {?phase <http://data.total/resource/tsf/dalia-lifex-costs/endDate> ?endDate.} \n" +
            "    OPTIONAL  {?phase  <http://data.total/resource/tsf/dalia-lifex-costs/phaseCost> ?phaseCost.} \n " +
            "    OPTIONAL  {?phase <http://data.total/resource/tsf/dalia-lifex-costs/POB> ?OffshoreConstructionPhase_POB.}\n" +
            "    OPTIONAL  {?phase <http://data.total/resource/tsf/dalia-lifex-costs/OffshoreManHours> ?OffshoreConstructionPhase_OffshoreManHours.}"
        if (phasePropertyUri) {
            query += "?phase  rdf:type <" + phasePropertyUri + ">.\n"
        }
        if (options.filter) {
            query += options.filter;
        }
        if (options.filterObj) {
            query += options.filterObj.filter;
        }

        if (options.subQueries) {
            options.filterObj.subQueries.forEach(function (subQuery) {
                query += "\n{ SELECT * WHERE{" + subQuery + "}}";
            });

        }

        query += " }  limit 10000";
        var url = Config.sources[Lifex_cost.currentSource].sparql_server.url + "?format=json&query=";
        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: Lifex_cost.currentSource}, function (err, result) {
            if (err) {
                return callback(err);
            }


            if (result.results.bindings.length >= 10000) {
                return (alert(" filter more precisely, too much data returned "));
            }
            result.results.bindings= Lifex_cost_HistoryManager.restoreTripleBindingsAtHistoryDate( result.results.bindings)

            UI.message("", true);
            callback(null, result);
        });


    }


    self.writeModifiedTriples = function (graphUri, triplesToDelete, triplesToWrite, options, callback) {

        function buildQuery(graphUri, operation, triples) {
            var query = "PREFIX " + Lifex_cost_JobCardController.prefixMap.prefix + ": <" + Lifex_cost_JobCardController.prefixMap.uri + ">\n "


            if (operation == "INSERT") {
                query += " with <" + graphUri + "> " + operation + " {"
                triples.forEach(function (triple) {
                    query += triple.subject + " " + triple.predicate + " " + triple.object + "."
                })
                query += "}"
            }
            if (operation == "DELETE") {// delete all triples with subjecs and predicate

                var subjects = []
                var predicates = []
                triples.forEach(function (triple) {
                    subjects.push(triple.subject)
                    predicates.push(triple.predicate)
                })
                var filter = Sparql_common.setFilter("s", subjects) + "  " + Sparql_common.setFilter("p", predicates)
                query += " with <" + graphUri + "> ";
                query += "DELETE {?s ?p ?o} where {?s ?p ?o." + filter + "}"
            }
            return query

        }

        function write(query, callback) {
            var url = Config.sparql_server.url + "?format=json&query=";


            //  return callback()
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {source: Config._defaultSource}, function (err, result) {
                if (err) {
                    return callback(err);
                }

                callback(null, result);
            });

        }


        async.series([

                //write old triples  in todayHistoryGraphUri
                function (callbackSeries) {
                    if (!options.history || triplesToDelete.length == 0) {
                        return callbackSeries()
                    }
                    var date = new Date()
                    var todayHistoryGraphUri = graphUri + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "/"
                    var query = buildQuery(todayHistoryGraphUri, "INSERT", triplesToDelete)
                    write(query, function (err, result) {
                        callbackSeries(err);
                    })

                },


                //delete triples in currentGraph
                function (callbackSeries) {
                    if (triplesToDelete.length == 0) {
                        return callbackSeries();
                    }
                    var query = buildQuery(graphUri, "DELETE", triplesToDelete)
                    write(query, function (err, result) {
                        callbackSeries(err);
                    })

                },

                //write new triples  in currentGraph
                function (callbackSeries) {
                    var query = buildQuery(graphUri, "INSERT", triplesToWrite)
                    write(query, function (err, result) {
                        callbackSeries(err);
                    })

                },

            ]

            , function (err) {
                return callback(err)


            })


    }

    return self;

})()

export default Lifex_cost_SparqlQueries;
