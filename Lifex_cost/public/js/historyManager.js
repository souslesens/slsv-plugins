var Lifex_cost_HistoryManager = (function () {
    var self = {}

    self.currentHistoryTriplesMap = null

    self.loadHistoryDates = function () {
        var filter = ""//"FILTER (?p=rdf:type)"
        Sparql_OWL.getGraphsWithSameClasses(Lifex_cost.currentSource, filter, function (err, result) {
            if (err) {
                return alert(err.responseText || err)
            }
            var suffixes = []
            var mainGraphUri = Config.sources[Lifex_cost.currentSource].graphUri
            result.forEach(function (item) {
                var graphUri = item.g.value

                var str = graphUri.replace(mainGraphUri, "")
                if (str.match(/[0-9]{4}-[0-9]{2}/)) {
                    suffixes.push({id: graphUri, label: str})
                }
            })
            common.fillSelectOptions("Lifex_cost_historyDatesSelect", suffixes, true, "label", "id")
        })

    }
    self.onSelectHistoryDate = function (graphUri) {
        self.currentHistoryTriplesMap = null
        if (!graphUri) {
            return;
        }

        Sparql_OWL.getAllTriples(null, null, null, {graphUri: graphUri}, function (err, result) {
            if (err) {
                return alert(err.responseText || err)
            }

            result.forEach(function (item) {
                if(!self.currentHistoryTriplesMap)
                    self.currentHistoryTriplesMap={}
                if (!self.currentHistoryTriplesMap[item.subject.value]) {
                    self.currentHistoryTriplesMap[item.subject.value] = {}
                }
                self.currentHistoryTriplesMap[item.subject.value][item.predicate.value] = item.object.value

            })
        })

    }

    self.restoreTripleBindingsAtHistoryDate = function (bindings) {
        if(!self.currentHistoryTriplesMap )
            return bindings;
        bindings.forEach(function (item,index) {
          if(item["phase"]){
             var  subject=item["phase"].value;
             if( self.currentHistoryTriplesMap[subject]){
                 for (var predicatesUri in self.currentHistoryTriplesMap[subject]){
                     var predicate=predicatesUri.substring(predicatesUri.lastIndexOf("/")+1)
                     if(item[predicate]){
                         item[predicate].value=self.currentHistoryTriplesMap[subject][predicatesUri]
                     }
                 }
             }

            }


        })
        return bindings

    }

    return self;
})()

export default Lifex_cost_HistoryManager;
window.Lifex_cost_HistoryManager = Lifex_cost_HistoryManager