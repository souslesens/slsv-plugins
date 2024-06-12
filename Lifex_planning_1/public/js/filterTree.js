

var FilterTree=(function(){

var self={}

  self.loadTree=function(source) {
return;
    self.currentSource=source

    var options={
        filter:"",//"?member rdfs:label '+LIFEX_DALIA'.",
        jstreeOptions : {
            openAll: false,
            contextMenu: FilterTree.getContextJstreeMenu(),
            selectTreeNodeFn: FilterTree.onSelectedNodeTreeclick,

        }

    }
      Containers_tree.search("Lifex_planning_jstreeFilterDiv",source,options)


  }
    self.onSelectedNodeTreeclick = function (event, obj) {
        self.currentNode = obj.node;

       /* if (obj.event.button != 2) {

        }*/
    };


    self.getContextJstreeMenu = function () {
        var items = {};
        items["NodeInfos"] = {
            label: "Node infos",
            action: function(_e) {
                NodeInfosWidget.showNodeInfos(self.currentSource, self.currentNode, "mainDialogDiv");
            },
        };
        items["Filter"] = {
            label: "Filter by",
            action: function(_e) {

                var type=self.currentNode.parents[self.currentNode.parents.length-2]
            },
        };
        items["Draw"] = {
            label: "Filter by",
            action: function(_e) {
                var type=self.currentNode.parents[self.currentNode.parents.length-2]
            },
        };
    }






    return self;
})()

export default FilterTree;
window.FilterTree=FilterTree

