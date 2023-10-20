/** The MIT License
 Copyright 2020 Claude Fauconnet / SousLesens Claude.fauconnet@gmail.com

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var DataGovernor = (function () {
    var self = {};
    self.drawNodesInProgress = false;
    self.currentSources = null;
    self.currentDiv = null;
    self.fromStr = null;
    self.rowNumber = null;
    self.ProposalColors = false;
    self.LegendOfProposals = null;
    self.initProposalTab = function () {
        $("#Lineage_proposalsTab").load("snippets/lineage/Proposals/lineage_proposal_tab.html", function () {
            $("#Lineage_proposals_Tabs").append('<div class="lineage_actionDiv" id="Modifpannel" style="display: flex; flex-direction: column"></div>');
            $("#Modifpannel").append('<button id="fullscreen" ><img src="../icons/fullscreen.png"></button>');
            $("#fullscreen").css({
                border: "none",
                cursor: "pointer",
                appearance: "none",
                "background-color": "inherit",
                width: "50px",
                heigth: "50px",
                position: "relative",
                left: "85%",
            });
            $("#Modifpannel").append('<div id="JournalDiv"></div>');
            if (Lineage_sources.fromAllWhiteboardSources) {
                alert("You need to select a single active source, desactivate with A button or click on a source in left source table");
            } else {
                if (Lineage_sources.activeSource) {
                    DataGovernor.journalRequestTab([Lineage_sources.activeSource], "JournalDiv");
                }
            }
        });
    };
    self.displayModificationAtGraph = function (row) {
        var edge_style = false;
        var edge_color = "#097969";
        var is_activate = $(row).attr("class").includes("selected");
        var is_modif_or_proposal = $("#Modif_tab").attr("aria-selected") ? "Modification" : "Proposal";
        if (is_modif_or_proposal == "Proposal") {
            edge_style = true;
        }

        //Don't activate if we deselected a row
        var triples_to_display = $(row).children()[4].innerHTML;
        if ($(Export.dataTable.column(0).header()).html() == "Triples concerned") {
            triples_to_display = $(row).children()[0].innerHTML;
        }
        if ($(row).children()[3].innerHTML == "Deletion") {
            edge_color = "#C41E3A";
        }

        var all_triples = triples_to_display.split(";\n");
        var all_triples_dict = [];
        all_triples.forEach((element, item) => {
            var sub = element.split(",predicate : ");
            var pred = sub[1];
            sub = sub[0];
            sub = sub.split("subject : ")[1];
            var obj = pred.split(",object : ")[1];
            pred = pred.split(",object : ")[0];
            all_triples_dict.push({ sub, pred, obj });
        });
        // In each triple,
        // look if they exist on the source
        // if they exist display them

        //else look if object is URI and add nodes and edges
        var visjsData = { nodes: [], edges: [] };
        var existingNodes = {};
        var existingEdges = {};
        if (Lineage_classes.lineageVisjsGraph.data) {
            if (is_activate) {
                Lineage_classes.lineageVisjsGraph.data.nodes.get().forEach((element, item) => {
                    existingNodes[element.id] = 1;
                });
            }
        }
        if (Lineage_classes.lineageVisjsGraph.data.edges.length > 0) {
            if (is_activate) {
                Lineage_classes.lineageVisjsGraph.data.edges.get().forEach((element, item) => {
                    existingEdges[element.id] = 1;
                });
            }
        }

        all_triples_dict.forEach((element, item) => {
            var attrs = Lineage_classes.getNodeVisjAttrs(element["sub"], null, "HR-MODEL-2");
            var isuri = true;
            if (!existingNodes[element["sub"]]) {
                if (!element["sub"].startsWith("http")) {
                    attrs.color = "#848482";
                    isuri = false;
                }
                var label = element["sub"];
                // Search in all_triples_dict sub==element['sub'] //pred=='http://www.w3.org/2000/01/rdf-schema#label' --> label=value
                var type = null;
                var subclass = null;
                var finded_label = all_triples_dict.find((o) => o.sub == element["sub"] && o.pred == "http://www.w3.org/2000/01/rdf-schema#label");
                if (finded_label) {
                    label = finded_label.obj;
                }
                var finded_type = all_triples_dict.filter((o) => o.sub == element["sub"] && o.pred == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
                if (finded_type) {
                    type = finded_type.map((x) => x.obj);
                }
                var finded_subclass = all_triples_dict.filter((o) => o.sub == element["sub"] && o.pred == "http://www.w3.org/2000/01/rdf-schema#subClassOf");
                if (finded_subclass) {
                    subclass = finded_subclass.map((x) => x.obj);
                }
                visjsData.nodes.push({
                    id: element["sub"],
                    label: label,
                    shadow: Lineage_classes.nodeShadow,
                    shape: attrs.shape,
                    color: attrs.color,
                    size: Lineage_classes.defaultShapeSize,
                    level: Lineage_classes.currentExpandLevel,
                    data: {
                        source: Lineage_sources.activeSource,
                        label: element["sub"],
                        id: element["sub"],
                        fromapp: is_modif_or_proposal,
                        type: type,
                        subclass: subclass,
                        isuri: isuri,
                    },
                });
                existingNodes[element["sub"]] = 1;
            }

            var attrs = Lineage_classes.getNodeVisjAttrs(element["sub"], null, "HR-MODEL-2");
            if (!existingEdges["from" + element["sub"] + "to" + element["obj"]]) {
                visjsData.edges.push({
                    id: "from" + element["sub"] + "to" + element["obj"],
                    label: element["pred"],
                    dashes: edge_style,
                    from: element["sub"],
                    to: element["obj"],
                    color: edge_color,
                    font: { color: edge_color, size: "7" },
                });
                existingEdges["from" + element["sub"] + "to" + element["obj"]] = 1;
            }
            isuri = true;
            if (!existingNodes[element["obj"]]) {
                if (!element["obj"].startsWith("http")) {
                    attrs.color = "#848482";
                    isuri = false;
                }

                var label = element["obj"];
                // Search in all_triples_dict sub==element['sub'] //pred=='http://www.w3.org/2000/01/rdf-schema#label' --> label=value
                var type = null;
                var subclass = null;
                var finded_label = all_triples_dict.find((o) => o.sub == element["obj"] && o.pred == "http://www.w3.org/2000/01/rdf-schema#label");
                if (finded_label) {
                    label = finded_label.obj;
                }
                var finded_type = all_triples_dict.filter((o) => o.sub == element["obj"] && o.pred == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
                if (finded_type) {
                    type = finded_type.map((x) => x.obj);
                }
                var finded_subclass = all_triples_dict.filter((o) => o.sub == element["obj"] && o.pred == "http://www.w3.org/2000/01/rdf-schema#subClassOf");
                if (finded_subclass) {
                    subclass = finded_subclass.map((x) => x.obj);
                }
                visjsData.nodes.push({
                    id: element["obj"],
                    label: label,
                    shadow: Lineage_classes.nodeShadow,
                    shape: attrs.shape,
                    color: attrs.color,
                    size: Lineage_classes.defaultShapeSize,
                    level: Lineage_classes.currentExpandLevel,
                    data: {
                        source: Lineage_sources.activeSource,
                        label: element["obj"],
                        id: element["obj"],
                        fromapp: is_modif_or_proposal,
                        type: type,
                        subclass: subclass,
                        isuri: isuri,
                    },
                });
                existingNodes[element["obj"]] = 1;
            }
        });

        // Si is activate == false Itérer sur la liste des noeuds à supprimer et regarder si il reste des edges from ou des edges to égal à ces noeuds à supprimer dans l'ensemble allcurrentedges privé de  visjsData.edges
        if (!is_activate) {
            var visjsDataEdgesIds = visjsData.edges.map((x) => x.id);
            var GraphEdgesIds = Lineage_classes.lineageVisjsGraph.data.edges.get().map((x) => x.id);
            // Disjoint id between current drawed edges and
            var disjointIds = GraphEdgesIds.filter((value) => !visjsDataEdgesIds.includes(value));
            var disjointItems = Lineage_classes.lineageVisjsGraph.data.edges.get().filter((value) => disjointIds.includes(value.id));
            var nodesToKeep = disjointItems.map((x) => x.to).concat(disjointItems.map((x) => x.from));
            visjsData.nodes = visjsData.nodes.filter((x) => !nodesToKeep.includes(x.id));
        }

        if (!Lineage_classes.lineageVisjsGraph.isGraphNotEmpty()) {
            Lineage_classes.drawNewGraph(visjsData);
        } else {
            if (is_activate) {
                Lineage_classes.lineageVisjsGraph.data.nodes.add(visjsData.nodes);
                Lineage_classes.lineageVisjsGraph.data.edges.add(visjsData.edges);
            } else {
                Lineage_classes.lineageVisjsGraph.data.nodes.remove(visjsData.nodes);
                Lineage_classes.lineageVisjsGraph.data.edges.remove(visjsData.edges);
            }

            //Lineage_classes.lineageVisjsGraph.network.fit();
        }
    };

    self.deleteTracker = function (sourceLabel, filterStr) {
        var graphUri = Config.sources[sourceLabel].graphUri;
        var hasEditingRights = Lineage_sources.isSourceEditableForUser(sourceLabel);
        if (hasEditingRights && !Config.sources[sourceLabel].Journal) {
            return true;
        } else {
            var fakeGraphUri = graphUri + "changeTrackerModifications/";
            var id_modif = common.getRandomHexaId(9);
            var uri_modif = fakeGraphUri + "modification/" + id_modif;
            var change_tracker_triples = [];
            var login = authentication.currentUser.login;
            var requestUri = "http://souslesens.org/resource/models/dataGovernance/isrequestedBy";
            var hasStatus = "http://souslesens.org/resource/models/dataGovernance/hasStatus";
            var toTreat = "http://souslesens.org/resource/models/dataGovernance/To_Treat";
            var treated = "http://souslesens.org/resource/models/dataGovernance/Treated";
            //  var authorUri = Config.defaultNewUriRoot + "users/" + login;
            var dateTime = common.dateToRDFString(new Date()) + "^^xsd:dateTime";
            change_tracker_triples.push({ subject: uri_modif, predicate: "http://souslesens.org/resource/models/dataGovernance/implementsDelete", object: filterStr });
            change_tracker_triples.push({ subject: uri_modif, predicate: "http://www.w3.org/2002/07/owl#hasValue", object: dateTime });
            change_tracker_triples.push({ subject: uri_modif, predicate: requestUri, object: login });
            if (!hasEditingRights) {
                change_tracker_triples.push({ subject: uri_modif, predicate: hasStatus, object: toTreat });
            } else {
                change_tracker_triples.push({ subject: uri_modif, predicate: hasStatus, object: treated });
            }

            var url = Config.default_sparql_url;
            var query = `
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            SELECT * FROM <${graphUri}> WHERE {
                ?s ?p ?o .
                ${filterStr}
            } 
            `;

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {}, function (err, result) {
                var Subject_uri = "http://souslesens.org/resource/models/dataGovernance/hasSubject";
                var Predicate_uri = "http://souslesens.org/resource/models/dataGovernance/hasPredicate";
                var Object_uri = "http://souslesens.org/resource/models/dataGovernance/hasObject";
                var prop_triples = "http://souslesens.org/resource/models/dataGovernance/deleteConcernsTriples";

                if (result.results.bindings.length > 0) {
                    result.results.bindings.forEach((element, item) => {
                        var uri_triple = fakeGraphUri + "triple/" + id_modif + "/" + item.toString();

                        change_tracker_triples.push({ subject: uri_modif, predicate: prop_triples, object: uri_triple });
                        change_tracker_triples.push({ subject: uri_triple, predicate: Subject_uri, object: element.s.value });
                        change_tracker_triples.push({ subject: uri_triple, predicate: Predicate_uri, object: element.p.value });
                        change_tracker_triples.push({ subject: uri_triple, predicate: Object_uri, object: element.o.value });
                    });

                    Sparql_generic.insertTriples(fakeGraphUri, change_tracker_triples, { graphUri: true, changeTrackInsert: true }, function (err, result) {});
                }
            });
            if (!hasEditingRights) {
                alert(
                    "You have not the rights to directly add a node but the modification request has been taken in charge, see DataGovernor tool to accept the change by people who have the readwrite rights"
                );
            }
            if (!hasEditingRights) {
                return false;
            } else {
                return true;
            }
        }
    };
    self.insertChangeTraker = function (sourceLabel, _triples, options, callback) {
        //Vérifier les droits global admin or source admin --> court circuiter la function et continuer (return true)
        //return false et enregistrer triplets dans un graph

        var graphUri = Config.sources[sourceLabel].graphUri;
        var hasEditingRights = Lineage_sources.isSourceEditableForUser(sourceLabel);
        // if il a les droits et la source n'a pas l'option tracker l'ensemble des modifs return true
        if (hasEditingRights && !Config.sources[sourceLabel].Journal) {
            return true;
        } else {
            var fakeGraphUri = graphUri + "changeTrackerModifications/";
            var id_modif = common.getRandomHexaId(9);
            var uri_modif = fakeGraphUri + "modification/" + id_modif;
            var change_tracker_triples = [];
            var implement_uri = "http://souslesens.org/resource/models/dataGovernance/implementsTriples";
            var Subject_uri = "http://souslesens.org/resource/models/dataGovernance/hasSubject";
            var Predicate_uri = "http://souslesens.org/resource/models/dataGovernance/hasPredicate";
            var Object_uri = "http://souslesens.org/resource/models/dataGovernance/hasObject";
            var requestUri = "http://souslesens.org/resource/models/dataGovernance/isrequestedBy";
            var hasStatus = "http://souslesens.org/resource/models/dataGovernance/hasStatus";
            var toTreat = "http://souslesens.org/resource/models/dataGovernance/To_Treat";
            var treated = "http://souslesens.org/resource/models/dataGovernance/Treated";
            var login = authentication.currentUser.login;
            //  var authorUri = Config.defaultNewUriRoot + "users/" + login;
            var dateTime = common.dateToRDFString(new Date()) + "^^xsd:dateTime";

            _triples.forEach((element, item) => {
                var uri_triple = fakeGraphUri + "triple/" + id_modif + "/" + item.toString();

                change_tracker_triples.push({ subject: uri_modif, predicate: implement_uri, object: uri_triple });
                change_tracker_triples.push({ subject: uri_triple, predicate: Subject_uri, object: element.subject });
                change_tracker_triples.push({ subject: uri_triple, predicate: Predicate_uri, object: element.predicate });
                change_tracker_triples.push({ subject: uri_triple, predicate: Object_uri, object: element.object });
            });
            change_tracker_triples.push({ subject: uri_modif, predicate: "http://www.w3.org/2002/07/owl#hasValue", object: dateTime });
            change_tracker_triples.push({ subject: uri_modif, predicate: requestUri, object: login });
            // ajouter le triplet to treat pour le cas sans les droits et returner false
            if (!hasEditingRights) {
                change_tracker_triples.push({ subject: uri_modif, predicate: hasStatus, object: toTreat });
            } else {
                change_tracker_triples.push({ subject: uri_modif, predicate: hasStatus, object: treated });
            }

            //ajouté le triplet treated pour le cas avec droit plus retourner true
            Sparql_generic.insertTriples(fakeGraphUri, change_tracker_triples, { graphUri: true, changeTrackInsert: true }, function (err, result) {
                if (!hasEditingRights) {
                    alert(
                        "You have not the rights to directly add a node but the modification request has been taken in charge, see DataGovernor tool to accept the change by people who have the readwrite rights"
                    );
                }
            });

            if (!hasEditingRights) {
                return false;
            } else {
                return true;
            }
        }
    };
    (self.journalRequestTab = function (sources, div, proposals) {
        // Get selected sources
        if (!sources) {
            var checked_nodes = $("#sourceSelector_jstreeDiv").jstree(true).get_checked();
        } else {
            var checked_nodes = sources;
        }
        self.currentSources = checked_nodes;

        if (checked_nodes.length == 0) {
            alert("no checked sources");
            return;
        }
        checked_nodes = checked_nodes.filter((x) => Config.sources.hasOwnProperty(x));
        var list_graphUri = [];
        var fromStr = "";
        checked_nodes.forEach((element) => {
            list_graphUri.push(Config.sources[element].graphUri + "changeTrackerModifications/");
            fromStr += "FROM NAMED <" + Config.sources[element].graphUri + "changeTrackerModifications/>";
        });

        var url = Config.sources[checked_nodes[0]].sparql_server.url;
        self.currentSources = checked_nodes;
        self.fromStr = fromStr;

        if (!div) {
            var div = "Request_tab_Journal";
        }
        self.currentDiv = div;
        var proposals_rows = "<http://souslesens.org/resource/models/dataGovernance/Treated>";
        if (proposals) {
            var proposals_rows = "<http://souslesens.org/resource/models/dataGovernance/To_Treat>";
        }

        var query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            SELECT ?sub ?implementsOrDelete ?obj ?date ?account ?p ?triple_member  ${fromStr} WHERE 
            {GRAPH ?g{
            ?sub ?implementsOrDelete ?obj .
            ?sub <http://souslesens.org/resource/models/dataGovernance/hasStatus> ${proposals_rows}.
            ?sub owl:hasValue ?date.
            ?sub <http://souslesens.org/resource/models/dataGovernance/isrequestedBy> ?account.
            filter(?implementsOrDelete=<http://souslesens.org/resource/models/dataGovernance/implementsTriples> || ?implementsOrDelete=<http://souslesens.org/resource/models/dataGovernance/deleteConcernsTriples> )
            OPTIONAL{
                ?obj ?p ?triple_member.
            }
            
            
            
            } 
            }
            
            `;

        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {}, function (err, result) {
            var get_triples = {};
            var modifs = {};

            result.results.bindings.forEach((element) => {
                if (!get_triples[element.obj.value]) {
                    get_triples[element.obj.value] = {};
                }

                get_triples[element.obj.value][element.p.value] = element.triple_member.value;
                get_triples[element.obj.value]["account"] = element.account.value;
                get_triples[element.obj.value]["date"] = element.date.value;
                get_triples[element.obj.value]["modif"] = element.sub.value;
                if (element.implementsOrDelete.value == "http://souslesens.org/resource/models/dataGovernance/implementsTriples") {
                    get_triples[element.obj.value]["Operation"] = "Creation";
                } else {
                    get_triples[element.obj.value]["Operation"] = "Deletion";
                }

                //var triple_parsed='subject : '+triple_splited[0]+' predicate : '+triple_splited[1]+' object : '+triple_splited[2];
            });

            var Subject_uri = "http://souslesens.org/resource/models/dataGovernance/hasSubject";
            var Predicate_uri = "http://souslesens.org/resource/models/dataGovernance/hasPredicate";
            var Object_uri = "http://souslesens.org/resource/models/dataGovernance/hasObject";
            Object.keys(get_triples).forEach((element) => {
                var triple_parsed = "subject : " + get_triples[element][Subject_uri] + ",predicate : " + get_triples[element][Predicate_uri] + ",object : " + get_triples[element][Object_uri];
                if (modifs[get_triples[element]["modif"]]) {
                    modifs[get_triples[element]["modif"]][2] += ";\n" + triple_parsed;
                } else {
                    modifs[get_triples[element]["modif"]] = [get_triples[element]["date"], get_triples[element]["account"], triple_parsed, get_triples[element]["Operation"]];
                }
            });

            console.log(modifs);
            //cols = Operation,date,user,queries,triples
            var cols = [];
            cols.push({ title: "Modification identifiant", defaultContent: "", width: "15%" });
            cols.push({ title: "Date", defaultContent: "", width: "5%" });
            cols.push({ title: "Request from User", defaultContent: "", width: "5%" });
            cols.push({ title: "Operation", defaultContent: "", width: "5%" });
            cols.push({ title: "Triples concerned", defaultContent: "", width: "70%", render: $.fn.dataTable.render.text() });
            //cols.push({title: 'User', defaultContent: '', width: '20%'})
            var dataSet = [];
            Object.keys(modifs).forEach((element) => {
                if (div == "JournalDiv") {
                    dataSet.push([modifs[element][2], modifs[element][0], modifs[element][1], modifs[element][3], element]);
                } else {
                    dataSet.push([element, modifs[element][0], modifs[element][1], modifs[element][3], modifs[element][2]]);
                }
            });
            //dataSet.push([1,"29.10.2023",null]);
            if (div == "JournalDiv") {
                [cols[0], cols[4]] = [cols[4], cols[0]];
            }

            Export.showDataTable(
                self.currentDiv,
                cols,
                dataSet,
                null,
                { notDialog: true },
                [],
                {
                    scrollX: true,
                    scrollY: 600,
                },
                function () {
                    self.currentDiv = null;
                    $("#dataTableDivExport tbody").on("click", "tr", function () {
                        $(this).toggleClass("selected");
                        DataGovernor.displayModificationAtGraph(this);
                    });
                }
            );
        });
    }),
        (self.getNodesTypesMap = function (ids, options, callback) {
            // Il faut que cette fonction récupère les labels ainsi que les types pour les ids qui sont possibles
            // Pour cela il faut chercher soit dans le graph tampon soit dans le vrai graph.
            //Si il n'y a rien on peut en déduire que c'est des noeuds blancs.
            //  On peut faire directement les labels reliés aux noms dans la row
            if (!options) {
                options = {};
            }
            if (!Array.isArray(ids)) {
                ids = [ids];
            }
            var filterStr = Sparql_common.setFilter("id", ids);
            Lineage_sources.fromAllWhiteboardSources = true;
            var fromStr = Sparql_common.getFromStr(Lineage_sources.activeSource, false, options.withoutImports, true);
            Lineage_sources.fromAllWhiteboardSources = false;
            fromStr += "FROM <http://www.w3.org/1999/02/22-rdf-syntax-ns#> FROM <http://www.w3.org/2000/01/rdf-schema#> FROM <http://www.w3.org/2002/07/owl#>";
            var query =
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> " +
                'select ?id ?label (GROUP_CONCAT( distinct ?type;separator=";;")as ?types)   ' +
                fromStr +
                " where" +
                " { ?id rdf:type  ?type. ?id rdfs:label ?label" +
                filterStr +
                " }" +
                "GROUP  BY ?id ?label " +
                "limit 10000";

            var url = Config.sources[Lineage_sources.activeSource].sparql_server.url + "?format=json&query=";

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: Lineage_sources.activeSource }, function (err, result) {
                if (err) {
                    return callback(err);
                }
                var map = {};
                result.results.bindings.forEach(function (item) {
                    map[item.id.value] = { types: item.types.value, label: item.label.value };
                });
                return callback(null, map);
            });
        });
    (self.decorateNodes = function (visjsNodes) {
        if (!Config.topLevelOntologies[Config.currentTopLevelOntology]) {
            return $("#lineage_legendWrapper").css("display", "none");
        }

        var nonTopLevelOntologynodeIds = [];
        var topLevelOntologynodeIds = [];
        var individualNodes = {};
        if (true || !visjsNodes) {
            visjsNodes = Lineage_classes.lineageVisjsGraph.data.nodes.get();
        }

        if (visjsNodes.length == 0) {
            return;
        }
        var nodeIds = [];
        visjsNodes.forEach(function (node) {
            if (node.data.fromapp) {
                if (node.data.isuri) {
                    nodeIds.push(node.id);
                }
            }
        });

        var hierarchies = {};
        var upperOntologiesHierarchy = {};
        var legendJsTreeData = [];
        var legendClassesMap = {};
        var newVisJsNodes = [];
        var uniqueLegendJsTreeDataNodes = {};
        function getPredefinedColor(classId) {
            var color = null;
            for (var key in Config.topLevelOntologyFixedlegendMap) {
                if (!color) {
                    if (!Config.topLevelOntologyFixedlegendMap[key]) {
                        return Lineage_classes.getSourceColor(key);
                    }
                    color = Config.topLevelOntologyFixedlegendMap[key][classId];
                }
            }
            return color;
        }

        function getNodeColorInLegend(ancestors) {
            function getColorFromParent(ancestorNode, parent) {
                var color = legendClassesMap[ancestorNode.superClass.value];
                if (!color) {
                    color = getPredefinedColor(ancestorNode.class.value);
                    if (!color) {
                        color = getPredefinedColor(ancestorNode.superClass.value);
                    }

                    if (color) {
                        legendClassesMap[ancestorNode.superClass.value] = color;
                        if (!uniqueLegendJsTreeDataNodes[ancestorNode.superClass.value]) {
                            uniqueLegendJsTreeDataNodes[ancestorNode.superClass.value] = 1;
                            var label = ancestorNode.superClassLabel ? ancestorNode.superClassLabel.value : Sparql_common.getLabelFromURI(ancestorNode.superClass.value);
                            legendJsTreeData.push({
                                id: ancestorNode.superClass.value,
                                text: "<span  style='font-size:10px;background-color:" + color + "'>&nbsp;&nbsp;&nbsp;&nbsp;</span>&nbsp;" + label,
                                parent: parent,
                                color: color,
                            });
                        }
                    }
                }

                return color;
            }

            var color = null;
            for (var i = ancestors.length - 1; i > -1; i--) {
                var parent = "#";
                if (i != ancestors.length - 1) {
                    parent = ancestors[i + 1].class.value;
                }

                if (!color) {
                    color = getColorFromParent(ancestors[i]);
                    if (!color) {
                        if (i < ancestors.length - 1) {
                            color = getColorFromParent(ancestors[i + 1]);
                        }
                    }

                    /*   if( !color){
                 color=legendClassesMap[ancestors[i].superClass.value]

             }*/
                }
            }

            return color;
        }
        var nodeTypesMap = {};

        async.series(
            [
                // get nodes super Classes
                function (callbackSeries) {
                    var uniqueTypes = {};
                    var slices = common.array.slice(nodeIds, Config.slicedArrayLength);

                    async.eachSeries(
                        slices,
                        function (slice, callbackEach) {
                            DataGovernor.getNodesTypesMap(slice, {}, function (err, result) {
                                if (err) {
                                    return callbackEach(err);
                                }

                                for (var nodeId in result) {
                                    var obj = { allTypes: result[nodeId].types, class: "" };
                                    var types = result[nodeId].types.split(";");

                                    types.forEach(function (type) {
                                        if (!nodeTypesMap[nodeId] && type && type.indexOf("/owl") < 0 && type.indexOf("/rdf") < 0) {
                                            obj.class = type;
                                            if (slice.indexOf(type) < 0 && !uniqueTypes[type]) {
                                                uniqueTypes[type] = 1;
                                                slice.push(type);
                                            }
                                        }
                                        nodeTypesMap[nodeId] = obj;
                                    });
                                    var label = result[nodeId].label;
                                    Lineage_classes.lineageVisjsGraph.data.nodes.update({ id: nodeId, label: label });
                                }
                                // get types for no results and appartient of sclice (no results = nodes that are not referenced in the graph. ) add them in slice and negociate the hierarchies
                                //to add related results to this class

                                var nodes_of_proposal_row = slice.filter((x) => !Object.keys(result).includes(x));
                                var supplementary_classes = [];
                                nodes_of_proposal_row.forEach((element) => {
                                    var row_types = Lineage_classes.lineageVisjsGraph.data.nodes.get(element).data.type.concat(Lineage_classes.lineageVisjsGraph.data.nodes.get(element).data.subclass);
                                    supplementary_classes = supplementary_classes.concat(row_types.filter((x) => !x.includes("http://www.w3.org")));
                                });
                                supplementary_classes = supplementary_classes.filter((x) => slice.includes(x));
                                if (supplementary_classes.length > 0) {
                                    slice = slice.concat(supplementary_classes);
                                }

                                Sparql_OWL.getNodesAncestors(Lineage_sources.activeSource, slice, { excludeItself: 0 }, function (err, result) {
                                    if (err) {
                                        return callbackEach(err);
                                    }

                                    //result.hierarchies.filter(x=>x.length>0);
                                    // values .length =0 and on supplementary layer
                                    var Add_nodes_hierarchy = Object.entries(result.hierarchies).filter((x) => x[1].length == 0 && nodes_of_proposal_row.includes(x[0]));
                                    Add_nodes_hierarchy.forEach((element) => {
                                        var row_types = Lineage_classes.lineageVisjsGraph.data.nodes
                                            .get(element[0])
                                            .data.type.concat(Lineage_classes.lineageVisjsGraph.data.nodes.get(element[0]).data.subclass);
                                        row_types = row_types.filter((x) => !x.includes("http://www.w3.org"));
                                        if (row_types.length > 0) {
                                            if (result.hierarchies[row_types[0]].length > 0) {
                                                var object_to_add = {};
                                                object_to_add["superClass"] = result.hierarchies[row_types[0]][0]["subClass"];
                                                object_to_add["superClassLabel"] = result.hierarchies[row_types[0]][0]["subClassLabel"];
                                                object_to_add["superClassType"] = result.hierarchies[row_types[0]][0]["subClassType"];
                                                object_to_add["subClass"] = result.hierarchies[row_types[0]][0]["class"];
                                                object_to_add["subClassLabel"] = result.hierarchies[row_types[0]][0]["classLabel"];
                                                object_to_add["subClassType"] = result.hierarchies[row_types[0]][0]["classType"];
                                                object_to_add["class"] = { type: "uri", value: element[0] };
                                                object_to_add["classType"] = { value: row_types[0] };
                                                object_to_add["classLabel"] = { value: Lineage_classes.lineageVisjsGraph.data.nodes.get(element[0]).label };
                                                result.hierarchies[element[0]].push(object_to_add);
                                            }
                                        }
                                    });

                                    for (var key in result.hierarchies) {
                                        hierarchies[key] = result.hierarchies[key];
                                    }
                                    callbackEach();
                                });
                            });
                        },
                        function (err) {
                            callbackSeries();
                        }
                    );
                },
                //get each node color in legend

                function (callbackSeries) {
                    var uniqueNewVisJsNodes = {};
                    for (var nodeId in hierarchies) {
                        var ancestors = hierarchies[nodeId];
                        var color = null;

                        color = getNodeColorInLegend(ancestors);

                        if (!color) {
                            color = getPredefinedColor(nodeId);
                        }

                        var obj = { id: nodeId, color: color };

                        if (nodeTypesMap[nodeId] && nodeTypesMap[nodeId].allTypes.indexOf("Individual") > -1) {
                            obj.shape = "triangle";
                        }
                        if (nodeTypesMap[nodeId] && nodeTypesMap[nodeId].allTypes.indexOf("Bag") > -1) {
                            obj.shape = "box";
                        }
                        if (nodeIds.indexOf(nodeId) > -1) {
                            newVisJsNodes.push(obj);
                        } else {
                            legendClassesMap[nodeId] = color;
                        }
                    }

                    callbackSeries();
                },

                function (callbackSeries) {
                    for (var nodeId in hierarchies) {
                        //processing namedIndividuals
                        if (hierarchies[nodeId].length == 0 && nodeTypesMap[nodeId]) {
                            var color = legendClassesMap[nodeTypesMap[nodeId].class];
                            if (color) {
                                newVisJsNodes.push({ id: nodeId, color: color });
                            }
                        }
                    }
                    callbackSeries();
                },

                //change vijsNodes Color
                function (callbackSeries) {
                    Lineage_classes.lineageVisjsGraph.data.nodes.update(newVisJsNodes);
                    callbackSeries();
                },

                //draw legend
                function (callbackSeries) {
                    self.LegendOfProposals = legendJsTreeData;

                    callbackSeries();
                },
            ],
            function (err) {}
        );
    }),
        (self.mergeLegends = function (legendNonProposalsNodes) {
            var complete_legends = legendNonProposalsNodes;
            if (self.LegendOfProposals.length > 0) {
                complete_legends = self.LegendOfProposals.concat(legendNonProposalsNodes);

                complete_legends.push({
                    id: "litteral",
                    text: "<span  style='font-size:10px;background-color:#848482'>&nbsp;&nbsp;&nbsp;&nbsp;</span>&nbsp;Litterals",
                    parent: undefined,
                    color: "#848482",
                });
                //Drop duplicates colors and ids.
                var id_list = [];
                var complete_legends_drop_duplicate_id = [];
                complete_legends.forEach((item, index) => {
                    if (!id_list.includes(item.color)) {
                        complete_legends_drop_duplicate_id.push(item);
                        id_list.push(item.color);
                    }
                });

                //Ajouter le gris dans la légende et une couleure supplémentaire pour la couleure des URI without type
            }
            return complete_legends_drop_duplicate_id;
        }),
        (self.OkbuttonSelectSources = function () {
            var Pannel_of_request = `
    
        <div id="Datagovernor_Pannel_of_request">
            <ul>
                <li><a id="Inserts"  href="#Request_tab_Insert" >Inserts to treat</a></li>
                <li><a id="Deletes" href="#Request_tab_Delete" >Deletes to treat</a></li>
                <li><a id="Journal" href="#Request_tab_Journal" >Change tracker journal</a></li>
            </ul> 
            <div id="Request_tab_Insert"></div>
            <div id="Request_tab_Delete"></div>
            <div id="Request_tab_Journal"></div>
            
        </div>
        `;
            if (!$("#Datagovernor_Pannel_of_request")[0]) {
                $("#graphDiv").prepend(Pannel_of_request);
                $("#Datagovernor_Pannel_of_request").tabs({});
                $("#Inserts").bind("click", function () {
                    self.insertRequestTab();
                });
                $("#Deletes").bind("click", function () {
                    //$('#dataTableDivExport').remove();
                    self.DeleteRequestTab();
                });
                $("#Journal").bind("click", function () {
                    //$('#dataTableDivExport').remove();
                    self.journalRequestTab();
                });
            }

            self.insertRequestTab();
        });

    (self.insertRequestTab = function () {
        // Get selected sources
        var checked_nodes = $("#sourceSelector_jstreeDiv").jstree(true).get_checked();
        if (checked_nodes.length == 0) {
            alert("no checked sources");
            return;
        }
        checked_nodes = checked_nodes.filter((x) => Config.sources.hasOwnProperty(x));
        var list_graphUri = [];
        var fromStr = "";
        checked_nodes.forEach((element) => {
            list_graphUri.push(Config.sources[element].graphUri + "changeTrackerModifications/");
            fromStr += "FROM NAMED <" + Config.sources[element].graphUri + "changeTrackerModifications/>";
        });

        var url = Config.sources[checked_nodes[0]].sparql_server.url;
        self.currentSources = checked_nodes;
        self.fromStr = fromStr;
        var query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            SELECT ?sub ?obj ?date ?account ?p ?triple_member  ${fromStr} WHERE 
            {GRAPH ?g{
            ?sub <http://souslesens.org/resource/models/dataGovernance/implementsTriples> ?obj .
            ?sub <http://souslesens.org/resource/models/dataGovernance/hasStatus> <http://souslesens.org/resource/models/dataGovernance/To_Treat>.
            ?sub owl:hasValue ?date.
            ?sub <http://souslesens.org/resource/models/dataGovernance/isrequestedBy> ?account.
            ?obj ?p ?triple_member.
            
            } 
            }
            
            `;

        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {}, function (err, result) {
            var get_triples = {};
            result.results.bindings.forEach((element) => {
                //var triple_parsed='subject : '+triple_splited[0]+' predicate : '+triple_splited[1]+' object : '+triple_splited[2];
                if (!get_triples[element.obj.value]) {
                    get_triples[element.obj.value] = {};
                }
                var whichTriple = null;

                get_triples[element.obj.value][element.p.value] = element.triple_member.value;
                get_triples[element.obj.value]["account"] = element.account.value;
                get_triples[element.obj.value]["date"] = element.date.value;
                get_triples[element.obj.value]["modif"] = element.sub.value;
            });
            var modifs = {};
            var Subject_uri = "http://souslesens.org/resource/models/dataGovernance/hasSubject";
            var Predicate_uri = "http://souslesens.org/resource/models/dataGovernance/hasPredicate";
            var Object_uri = "http://souslesens.org/resource/models/dataGovernance/hasObject";
            Object.keys(get_triples).forEach((element) => {
                var triple_parsed = "subject : " + get_triples[element][Subject_uri] + " predicate : " + get_triples[element][Predicate_uri] + " object : " + get_triples[element][Object_uri];
                if (modifs[get_triples[element]["modif"]]) {
                    modifs[get_triples[element]["modif"]][2] += " ;\n" + triple_parsed;
                } else {
                    modifs[get_triples[element]["modif"]] = [get_triples[element]["date"], get_triples[element]["account"], triple_parsed];
                }
            });
            //cols = Operation,date,user,queries,triples
            var cols = [];
            cols.push({ title: "Modification identifiant", defaultContent: "", width: "20%" });
            cols.push({ title: "Date", defaultContent: "", width: "5%" });
            cols.push({ title: "Request from User", defaultContent: "", width: "5%" });
            cols.push({ title: "Triples concerned", defaultContent: "", width: "70%" });
            //cols.push({title: 'User', defaultContent: '', width: '20%'})
            var dataSet = [];
            Object.keys(modifs).forEach((element) => {
                dataSet.push([element, modifs[element][0], modifs[element][1], modifs[element][2]]);
            });
            //dataSet.push([1,"29.10.2023",null]);

            Export.showDataTable(
                "Request_tab_Insert",
                cols,
                dataSet,
                null,
                { notDialog: true },
                [
                    {
                        text: "Validate",
                        action: function (e, dt, node, config) {
                            self.ValidateModificationsSelected();
                        },
                    },
                    {
                        text: "Refuse",
                        action: function (e, dt, node, config) {
                            self.RefuseModificationsSelected();
                        },
                    },
                ],
                {
                    scrollY: 800,
                    scroller: true,
                },
                function () {
                    $("#dataTableDivExport tbody").on("click", "tr", function () {
                        $(this).toggleClass("selected");
                    });
                }
            );
        });
    }),
        (self.DeleteRequestTab = function () {
            // Get selected sources
            var checked_nodes = $("#sourceSelector_jstreeDiv").jstree(true).get_checked();
            if (checked_nodes.length == 0) {
                alert("no checked sources");
                return;
            }
            checked_nodes = checked_nodes.filter((x) => Config.sources.hasOwnProperty(x));
            var list_graphUri = [];
            var fromStr = "";
            checked_nodes.forEach((element) => {
                list_graphUri.push(Config.sources[element].graphUri + "changeTrackerModifications/");
                fromStr += "FROM NAMED <" + Config.sources[element].graphUri + "changeTrackerModifications/>";
            });

            var url = Config.sources[checked_nodes[0]].sparql_server.url;
            self.currentSources = checked_nodes;
            self.fromStr = fromStr;
            var query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        SELECT ?sub ?obj ?date ?account  ${fromStr} WHERE 
          {GRAPH ?g{
          ?sub <http://souslesens.org/resource/models/dataGovernance/implementsDelete> ?obj .
          ?sub <http://souslesens.org/resource/models/dataGovernance/hasStatus> <http://souslesens.org/resource/models/dataGovernance/To_Treat>.
          ?sub owl:hasValue ?date.
          ?sub <http://souslesens.org/resource/models/dataGovernance/isrequestedBy> ?account.
          
          } 
          }
         
        `;

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {}, function (err, result) {
                var modifs = {};
                result.results.bindings.forEach((element) => {
                    element.sub.value;
                    modifs[element.sub.value] = [element.date.value, element.account.value, element.obj.value];
                });

                //cols = Operation,date,user,queries,triples
                var cols = [];
                cols.push({ title: "Modification identifiant", defaultContent: "", width: "20%" });
                cols.push({ title: "Date", defaultContent: "", width: "5%" });
                cols.push({ title: "Request from User", defaultContent: "", width: "5%" });
                cols.push({ title: "Filter of deletion", defaultContent: "", width: "70%", render: $.fn.dataTable.render.text() });
                //cols.push({title: 'User', defaultContent: '', width: '20%'})
                var dataSet = [];
                Object.keys(modifs).forEach((element) => {
                    dataSet.push([element, modifs[element][0], modifs[element][1], modifs[element][2]]);
                });
                //dataSet.push([1,"29.10.2023",null]);

                Export.showDataTable(
                    "Request_tab_Delete",
                    cols,
                    dataSet,
                    null,
                    { notDialog: true },
                    [
                        {
                            text: "Validate",
                            action: function (e, dt, node, config) {
                                self.ValidateModificationsSelectedDelete();
                            },
                        },
                        {
                            text: "Refuse",
                            action: function (e, dt, node, config) {
                                self.RefuseDeletionSelected();
                            },
                        },
                    ],
                    {
                        scrollY: 800,
                        scroller: true,
                    },
                    function () {
                        $("#dataTableDivExport tbody").on("click", "tr", function () {
                            $(this).toggleClass("selected");
                        });
                    }
                );
            });
        }),
        (self.ValidateModificationsSelectedDelete = function () {
            var selected_rows = Export.dataTable.rows(".selected").data();
            var filterStr = "";

            for (var idx = 0; idx < selected_rows.length; idx++) {
                var element = selected_rows[idx];

                filterStr = element[3];
                var query = Sparql_generic.getDefaultSparqlPrefixesStr();
                var url = Config.sources[self.currentSources[0]].sparql_server.url;
                var graphUri = element[0].split("changeTrackerModifications")[0];
                query += "with <" + graphUri + "> " + " DELETE {?s ?p ?o} WHERE{ ?s ?p ?o " + filterStr + "}";
                Sparql_proxy.querySPARQL_GET_proxy(url, query, "", { source: self.currentSources[0] }, function (err, result) {
                    if (err) {
                        return err;
                    }
                    return null, result.results.bindings;
                });
            }
            self.RefuseDeletionSelected();
        }),
        (self.ValidateModificationsSelected = function () {
            var selected_rows = Export.dataTable.rows(".selected").data();
            var modifsUriToAccept = "";

            for (var idx = 0; idx < selected_rows.length; idx++) {
                var element = selected_rows[idx];
                modifsUriToAccept += "<" + element[0] + "> ";
            }

            var url = Config.sources[self.currentSources[0]].sparql_server.url;
            var query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
         SELECT * ${self.fromStr}	  WHERE 
          
         {

            GRAPH ?g{
         VALUES ?sub { ${modifsUriToAccept}	 }
         ?sub  <http://souslesens.org/resource/models/dataGovernance/implementsTriples> ?obj.
         ?obj ?p ?o  .
            }
           
         } 
        
          
       `;
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {}, function (err, result) {
                var Subject_uri = "http://souslesens.org/resource/models/dataGovernance/hasSubject";
                var Predicate_uri = "http://souslesens.org/resource/models/dataGovernance/hasPredicate";
                var Object_uri = "http://souslesens.org/resource/models/dataGovernance/hasObject";
                var mappingTriples = {};
                result.results.bindings.forEach((element) => {
                    if (!mappingTriples[element.obj.value]) {
                        mappingTriples[element.obj.value] = {};
                    }
                    if (element.p.value == Subject_uri) {
                        mappingTriples[element.obj.value]["subject"] = element.o.value;
                    }
                    if (element.p.value == Predicate_uri) {
                        mappingTriples[element.obj.value]["predicate"] = element.o.value;
                    }
                    if (element.p.value == Object_uri) {
                        mappingTriples[element.obj.value]["object"] = element.o.value;
                    }
                });
                var _triples = Object.values(mappingTriples);
                var source = self.currentSources;
                Sparql_generic.insertTriples(source, _triples, null, function (err, result) {
                    if (!err) {
                        self.RefuseModificationsSelected();
                    }
                });
            });
        }),
        (self.RefuseDeletionSelected = function () {
            var selected_rows = Export.dataTable.rows(".selected").data();
            var modifsUriToDelete = "";
            var UriToDelete = [];
            for (var idx = 0; idx < selected_rows.length; idx++) {
                var element = selected_rows[idx];
                modifsUriToDelete += "<" + element[0] + "> ";
                UriToDelete.push(element[0]);
            }

            var url = Config.sources[self.currentSources[0]].sparql_server.url;
            var withGraph = self.fromStr.replace("FROM NAMED", "with");
            var query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                ${withGraph}
                DELETE{
                    ?sub ?pred <http://souslesens.org/resource/models/dataGovernance/To_Treat> .
                
                }INSERT {
                    ?sub ?pred <http://souslesens.org/resource/models/dataGovernance/Treated>
                }
                
                WHERE 
                {
                VALUES ?sub { ${modifsUriToDelete}	 }
                ?sub ?pred <http://souslesens.org/resource/models/dataGovernance/To_Treat> .

                
                    
                    
                } 
                
                `;
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {}, function (err, result) {
                Export.dataTable.rows(".selected").remove().draw("false");
            });
        }),
        (self.RefuseModificationsSelected = function () {
            var selected_rows = Export.dataTable.rows(".selected").data();
            var modifsUriToDelete = "";
            var UriToDelete = [];
            for (var idx = 0; idx < selected_rows.length; idx++) {
                var element = selected_rows[idx];
                modifsUriToDelete += "<" + element[0] + "> ";
                UriToDelete.push(element[0]);
            }

            var url = Config.sources[self.currentSources[0]].sparql_server.url;
            var withGraph = self.fromStr.replace("FROM NAMED", "with");
            var query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            ${withGraph}
            DELETE{
                ?sub ?pred <http://souslesens.org/resource/models/dataGovernance/To_Treat> .
                
            }
            INSERT {
                ?sub ?pred <http://souslesens.org/resource/models/dataGovernance/Treated>
            }
            
            WHERE 
            {
            VALUES ?sub { ${modifsUriToDelete}	 }
            ?sub ?pred ?obj .
            ?sub ?pred <http://souslesens.org/resource/models/dataGovernance/To_Treat>.
                
                
            } 
            
            `;

            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", {}, function (err, result) {
                Export.dataTable.rows(".selected").remove().draw("false");
            });
        }),
        (self.onLoaded = function () {
            //  self.currentSource = sourceLabel;
            // self.currentSparql_server = Config.sources[sourceLabel].sparql_server;
            $("#actionDiv").html("");
            $("#graphDiv").html("");
            SearchWidget.searchableSourcesTreeIsInitialized = false;
            /*
        $("#graphDiv").load("snippets/standardizer/standardizer_central.html", function () {
            $("#standardizerCentral_tabs").tabs({});
            $("#standardizerRightPanel").load("snippets/standardizer/standardizer_right.html", function () {
                // pass
            });
        });
        */

            $("#actionDivContolPanelDiv").load("snippets/standardizer/standardizer_left.html", function () {
                $("#Lineage_classes_SearchSourceInput").bind("keydown", null, Standardizer.searchInSourcesTree);
                $("#Standardizer_leftTab").tabs({});
                $("#Words").remove();
                $("#Text").remove();
                $("#Sources").click();
                $("#Lineage_classes_SearchSourceInput").remove();
                $("#Standardizer_compare_button").remove();
            });
            //  MainController.UI.toogleRightPanel(true);
            /*
        $("#graphDiv").html("");

        $("#accordion").accordion("option", { active: 2 });
        */
            SearchUtil.initSourcesIndexesList(null, function (err, sources) {
                if (err) return MainController.UI.message(err);
                /*
            sources.sort();

            var read_sources=[]
            Object.keys(Config.currentProfile.sourcesAccessControl).forEach((element,item) => {
                if(Config.currentProfile.sourcesAccessControl[element]=='read'){
                    
                    read_sources.push(element.split('/').pop());
                }

            })
            sources=sources.filter(x => !read_sources.includes(x));
            */

                var options = {
                    withCheckboxes: true,
                };

                SourceSelectorWidget.initWidget(["OWL", "KNOWLEDGE_GRAPH", "SKOS"], "Standardizer_sourcesTree", false, Standardizer.onselectSourcesTreeNodeFn, null, options);

                // MainController.UI.showSources("Standardizer_sourcesTree", true, sources, ["OWL", "KNOWLEDGE_GRAPH", "SKOS"], options);

                var candidateEntities = sources;
                candidateEntities.splice(0, 0, "all");
                common.fillSelectOptions("KGadvancedMapping_filterCandidateMappingsSelect", candidateEntities, false);

                var sortList = ["alphabetic", "candidates"];
                sources.forEach(function (source) {
                    sortList.push({ value: "_search_" + source, text: source });
                });

                common.fillSelectOptions("KGmapping_distinctColumnSortSelect", sortList, false, "text", "value");
                self.matchCandidates = {};

                //   common.fillSelectOptions("Standardizer_sourcesSelect", sources, true);
            });
            setTimeout(function () {
                var read_sources = [];
                Object.keys(Config.currentProfile.sourcesAccessControl).forEach((element, item) => {
                    if (Config.currentProfile.sourcesAccessControl[element] == "read") {
                        read_sources.push(element.split("/").pop());
                    }
                });
                $("#sourceSelector_jstreeDiv").jstree(true).delete_node(read_sources);
                $("#sourceSelector_validateButton").attr("onclick", "DataGovernor.OkbuttonSelectSources()");
                $("#rightPanelDiv").remove();
            }, 500);
        });

    return self;
})();

export default DataGovernor;

window.DataGovernor = DataGovernor;
