import SavedQueriesWidget from "../../../../vocables/modules/uiWidgets/savedQueriesWidget.js";
import KGquery from "../../../../vocables/modules/tools/KGquery/KGquery.js";
import KGquery_myQueries from "../../../../vocables/modules/tools/KGquery/KGquery_myQueries.js";
import Sparql_proxy from "../../../../vocables/modules/sparqlProxies/sparql_proxy.js";

var TagsGeometry = (function() {
    var self = {};

    self.setConfig = function (config) {
        self.config = config
    }

    self.onLoaded = function() {


        $("#lateralPanelDiv").load("/plugins/TagsGeometry/html/tagsGeometry_leftPanel.html", function() {
            $("#graphDiv").load("/plugins/TagsGeometry/html/tagsGeometry_rightPanel.html", function(x, y) {

                self.initCanvas("canvas");
                self.initControls();

                SavedQueriesWidget.showDialog("STORED_KGQUERY_QUERIES", "tagsGeometrySoredQueries", "LIFEX-DALIA_1", null, null, TagsGeometry.execSavedKGquery);

            });
        });
    };

    self.deckColors = {
        "Main Deck": "black",
        "Mezzanine Deck": "red",
        "Upper Deck": "blue"
    };
    self.disciplineColors = {
        "Control Systems and PLCs": "#8efd00",
        Electrical: "#00eafd",
        "Instrumentation ( including Valves and PSV )": "#fdac00",
        "Mechanical Rotating": "#000efd",
        "Mechanical Static equipments": "#8200fd",
        "Piping valves and vessels": "#f500fd",
        Structure: "#c3c3c3"
    };

    self.initControls = function() {
        var jstreeData = [
            {
                id: "discipline",
                text: "discipline",
                parent: "#"
            },
            {
                id: "deck",
                text: "deck",
                parent: "#"
            },
            {
                id: "JobCard",
                text: "JobCard",
                parent: "#"
            }
        ];
        var disciplines = Object.keys(self.disciplineColors);
        disciplines.forEach(function(discipline, index) {
            var color = self.disciplineColors[discipline];
            jstreeData.push({
                id: discipline,
                text: "<span style='color:" + color + "'>" + discipline + "</span>",
                parent: "discipline"
            });
        });
        var decks = Object.keys(self.deckColors);
        decks.forEach(function(deck, index) {
            jstreeData.push({
                id: deck,
                text: deck,
                parent: "deck"
            });
        });
        var options = {
            selectTreeNodeFn: TagsGeometry.onSelectTreeNode,
            openAll: true,
            withCheckboxes: true
        };
        //  options.contextMenu = self.jstreeContextMenu();

        self.loadAllJobCards(jstreeData, function(err) {
            JstreeWidget.loadJsTree("tagsGeometryTreeDiv", jstreeData, options);
        });
    };
    self.onSelectTreeNode = function(evt, obj) {
        if ((obj.node.parent = "JobCard")) {
            self.unSelectObjects();
            self.selectObject("number", obj.node.id);
        }
    };

    self.loadAllJobCards = function(jstreeData, callback) {
        var sql = "select distinct number from V_jobcard order by number";
        self.execSql(sql, function(err, result) {
            if (err) {
                return callback();
            }
            result.rows.forEach(function(item) {
                jstreeData.push({
                    id: item.number,
                    text: item.number,
                    parent: "JobCard"
                });
            });
            return callback();
        });
    };

    self.draw = function(filterTags) {
        self.selectedObjects = [];
        self.canvas.clear();
        var filterDeck = "";
        var filterDisicipline = "";
        var filterJC = "";

        var checkedOptions = $("#tagsGeometryTreeDiv").jstree(true).get_checked(true);

        checkedOptions.forEach(function(item) {
            if (item.parent == "deck") {
                if (filterDeck != "") {
                    filterDeck += ",";
                }
                filterDeck += "'" + item.text + "'";
            }
            if (item.parent == "discipline") {
                if (filterDisicipline != "") {
                    filterDisicipline += ",";
                }
                var str = item.text.replace(/<[^>]*>/g, "");
                filterDisicipline += "'" + str + "'";
            }
            if (item.parent == "JobCard") {
                return;
                if (filterJC != "") {
                    filterJC += ",";
                }
                filterJC += "'" + item.text + "'";
            }
        });
        var allFilter = "";
        if (filterDeck != "") {
            allFilter += "deck in (" + filterDeck + ")";
        }
        if (filterDisicipline != "") {
            if (allFilter != "") {
                allFilter += " and ";
            }

            allFilter += "disciplineName in (" + filterDisicipline + ")";
        }
        if (filterJC != "") {
            if (allFilter != "") {
                allFilter += " and ";
            }
            allFilter += "number in (" + filterJC + ")";
        }

        if (allFilter != "") {
            allFilter = " where " + allFilter;
        }

        var sqlQuery = "select * from V_JC_tags_coords " + allFilter;
        self.execSql(sqlQuery, function(err, data) {
            if (err) {
                return alert(err.responseText);
            }

            self.currentTagsData = data.rows;
            self.drawDataOnCanvas(data.rows, filterTags);
            // self.canvas.add(group);
        });
        setTimeout(function() {
            var objects = self.canvas.getObjects();
            objects.forEach(function(obj) {
                obj.moveTo(obj.data.index);
            });
        }, 2000);
    };

    self.drawDataOnCanvas = function(data, filterTags) {
        self.canvas.clear();
        self.initControls();
        data.sort(function(a, b) {
            var aw = a.y_max - a.y_min;
            var bw = b.y_max - b.y_min;
            if (aw > bw) {
                return -1;
            }
            if (bw > aw) {
                return 1;
            }
            return 0;
        });

        var coef = 4;
        data.forEach(function(item, index) {
            item.x_min *= coef;
            item.y_min *= coef;
            item.x_max *= coef;
            item.y_max *= coef;
        });


        var group = new fabric.Group();


        data.forEach(function(item, index) {
            var w = item.y_max - item.y_min;
            var h = item.x_max - item.x_min;
            item.index = index;
            var color = self.disciplineColors[item.disciplineName] || "#bbb";
            var color2 = "rgba(0,0,0,0)";
            var color3 = self.disciplineColors[item.disciplineName] || "#555";
            if (filterTags && filterTags[item.tag]) {
                color = "#aa1151";
                //   color2 = "#aa1151";
                color3 = "#aa1151";
            }


            if (w < 1 || h < 1) {
                var dot = new fabric.Circle({
                    radius: coef,
                    fill: color,
                    stroke: color,
                    strokeWidth: 0.2,
                    top: item.x_max,
                    left: item.y_min,
                    data: item
                });
                self.canvas.add(dot);
            } else {
                const rect = new fabric.Rect({
                    //  evented:false,
                    top: item.x_min,
                    left: item.y_min,
                    width: w,
                    height: h,
                    //  fill: self.disciplineColors[item.disciplineName],
                    fill: color2,
                    // stroke: self.deckColors[item.deck],
                    stroke: color3,
                    strokeWidth: 0.2,
                    data: item
                    // selectable: false
                    // opacity: 0.9
                });
                // group.add(rect)
                self.canvas.add(rect);

            }
        });
        self.canvas.setZoom(2);
    };

    self.showObjectInfos = function(object) {
        var html = "";
        for (var key in object.data) {
            var buttonStr = "";
            if (key == "number") {
                buttonStr = "<button onclick=\"TagsGeometry.selectObject('number','" + object.data[key] + "');\">G</button>";
            }

            html += key + ":" + object.data[key] + buttonStr + "<br>";
        }

        $("#tagsGeometryInfosDiv").html(html);
        $("#tagsGeometryTabs").tabs("option", "active", 1);
    };

    self.execSql = function(sqlQuery, callback) {
        var dbName = "testPG1";
        var sqlType = "sql.sqlserver";
        const params = new URLSearchParams({
            type: sqlType,
            sqlQuery: sqlQuery,
            name: self.config.databaseId,
            dbName:dbName
        });

        $.ajax({
            type: "GET",
            url: Config.apiUrl + "/kg/data?" + params.toString(),
            dataType: "json",

            success: function(data, _textStatus, _jqXHR) {
                callback(null, data);
            },
            error(err) {
                callback(err);
            }
        });
    };

    self.initCanvas = function(canvasDivId) {
        const canvas = new fabric.Canvas(canvasDivId, {
            // selection :false,
            backgroundColor: "#ddd", // 'rgb(100,100,200)',
            selectionColor: "blue",
            selectionLineWidth: 1,
            width: $("#graphDiv").width(),
            height: $("#graphDiv").height()
        });
        self.canvas = canvas;
        canvas.on("mouse:wheel", function(opt) {
            var delta = opt.e.deltaY;
            var zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 50) {
                zoom = 50;
            }
            if (zoom < 0.01) {
                zoom = 0.01;
            }
            canvas.setZoom(zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        canvas.toggleDragMode(true);
        canvas.on("mouse:down", function(opt) {
            self.currentObject = canvas.getActiveObject();
            if (self.currentObject) {
                self.showObjectInfos(self.currentObject);
            }
            return false;
        });

    };

    const STATE_IDLE = "idle";
    const STATE_PANNING = "panning";
    fabric.Canvas.prototype.toggleDragMode = function(dragMode) {
        // Remember the previous X and Y coordinates for delta calculations
        let lastClientX;
        let lastClientY;
        // Keep track of the state
        let state = STATE_IDLE;
        // We're entering dragmode
        if (dragMode) {
            // Discard any active object
            this.discardActiveObject();
            // Set the cursor to 'move'
            this.defaultCursor = "move";
            // Loop over all objects and disable events / selectable. We remember its value in a temp variable stored on each object
            this.forEachObject(function(object) {
                object.prevEvented = object.evented;
                object.prevSelectable = object.selectable;
                object.evented = false;
                object.selectable = false;
            });
            // Remove selection ability on the canvas
            this.selection = false;
            // When MouseUp fires, we set the state to idle
            this.on("mouse:up", function(e) {
                state = STATE_IDLE;
            });
            // When MouseDown fires, we set the state to panning
            this.on("mouse:down", (e) => {
                state = STATE_PANNING;
                lastClientX = e.e.clientX;
                lastClientY = e.e.clientY;
            });
            // When--------------- the mouse moves, and we're panning (mouse down), we continue
            this.on("mouse:move", (e) => {
                if (state === STATE_PANNING && e && e.e) {
                    // let delta = new fabric.Point(e.e.movementX, e.e.movementY); // No Safari support for movementX and movementY
                    // For cross-browser compatibility, I had to manually keep track of the delta

                    // Calculate deltas
                    let deltaX = 0;
                    let deltaY = 0;
                    if (lastClientX) {
                        deltaX = e.e.clientX - lastClientX;
                    }
                    if (lastClientY) {
                        deltaY = e.e.clientY - lastClientY;
                    }
                    // Update the last X and Y values
                    lastClientX = e.e.clientX;
                    lastClientY = e.e.clientY;

                    let delta = new fabric.Point(deltaX, deltaY);
                    this.relativePan(delta);
                    if (this.trigger) {
                        this.trigger("moved");
                    }
                }
            });
        } else {
            // When we exit dragmode, we restore the previous values on all objects
            this.forEachObject(function(object) {
                object.evented = object.prevEvented !== undefined ? object.prevEvented : object.evented;
                object.selectable = object.prevSelectable !== undefined ? object.prevSelectable : object.selectable;
            });
            // Reset the cursor
            this.defaultCursor = "default";
            // Remove the event listeners
            this.off("mouse:up");
            this.off("mouse:down");
            this.off("mouse:move");
            // Restore selection ability on the canvas
            this.selection = true;
        }
    };

    self.selectObject = function(key, value, unselect) {
        self.canvas.getObjects().forEach(function(o) {
            if (unselect) {
                self.canvas.setActiveObject(o);
                o.set("stroke", "black");
                o.set("fill", "black");
                o.set("strokeWidth", 0.1);
            }
            if (o.data[key] === value) {
                var stroke = o.get("stroke");
                var strokeW = o.get("strokeWidth");
                self.canvas.setActiveObject(o);
                o.set("stroke", "red");
                o.set("fill", "red");
                o.set("strokeWidth", 4);
            }
            self.selectedObjects.push(o);
        });
        self.canvas.renderAll();
    };
    self.unSelectObjects = function() {
        self.selectedObjects.forEach(function(o) {
            o.set("stroke", "black");
            // o.set("fill", "black")
            o.set("strokeWidth", 0.1);
        });

    };


    self.execSavedKGquery = function(err, result) {
        if (err) {
            return alert(err.responseText);
        }

        if (!result.sparqlQuery) {
            return alert("no sparql query to execute");
        }
        var queryObject = result.sparqlQuery;
        Sparql_proxy.querySPARQL_GET_proxy(queryObject.url, queryObject.query, "", { source: queryObject.source, caller: "getObjectRestrictions" }, function(err, result) {
            if (err) {
                alert(err.responseText);
            }

            var tagsMap = {};
            result.results.bindings.forEach(function(item) {
                for (var key in item) {
                    if (key.indexOf("tag") > -1) {
                        tagsMap[item[key].value] = 1;
                    }

                }

            });
            if (false && self.currentTagsData) {
                self.drawDataOnCanvas(self.currentTagsData, tagsMap);
            } else {
                self.draw(tagsMap);
            }
        });
    };

    return self;
})();

export default TagsGeometry;
window.TagsGeometry = TagsGeometry;
