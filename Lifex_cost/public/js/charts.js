
import Lifex_cost_FiltersWidget from "./filtersWidget.js";
import Lifex_cost_JobCardController from "./jobCardController.js";
var Lifex_cost_charts=(function(){

    var self={}
    self.drawGlobalChart2d=function(globalLifex_cost_YearlyDistribution,isDailyDistribution){

        self.isDailyDistribution=isDailyDistribution;
        self.chartData=globalLifex_cost_YearlyDistribution;
        if(self.globalChart2d){
            //destroy
            self.globalChart2d.destroy();
        }
        var container = document.getElementById("globalChart2dDiv");
        var chartItems=[];
        var groups = new vis.DataSet();
        /*var Offsetx=0;
        var Offsety=10;
        var offsetCoeff={};*/
        var uniqueGroups={}
        var yAxis=$('#Lifex_cost_quantityVarSelect').val();
        var splitVar=$('#Lifex_cost_SplitBySelect').val();
        var cumul=0;

        if (splitVar == "") {
            groups.add({ id: 'NA', content: "NA",className:'vis-graph-group0' });
            uniqueGroups["NA"]=1
            groups.add({id: 'global', content: "global",className:'vis-graph-group1'});
            uniqueGroups["global"]=1
            /*if(yAxis=='CAPEX'){
                groups.add({id: 'global_capex', content: "global_capex",className:'vis-graph-group2'});
                uniqueGroups["global_capex"]=1
            }*/
            

        }
        if(splitVar=='Cost Type'){
            groups.add({id: 'CAPEX', content: "CAPEX",className:'vis-graph-group0'});
            uniqueGroups["CAPEX"]=1
            groups.add({id: 'phaseCost', content: "phaseCost",className:'vis-graph-group1'});
            uniqueGroups["phaseCost"]=1

        }
        

        for(var key in globalLifex_cost_YearlyDistribution) {


            if (splitVar != '' || splitVar=='Cost Type') {
                if(!uniqueGroups[key]){
                   
                    
                    groups.add({id: key, content: key,className:'vis-graph-group'+Object.keys(uniqueGroups).length});
                    uniqueGroups[key]=1;
                  
                }

            }


           
            var yearItem;
            Object.keys(globalLifex_cost_YearlyDistribution[key]).forEach(function (year) {
                yearItem = {};

                if(globalLifex_cost_YearlyDistribution[key][year].value==0 ){
                    return;
                }
                
                if((year=='noYear' || year=='NA') && isDailyDistribution){
                    return;
                }


                yearItem.x = year + '-01-01';

                if(isDailyDistribution){
                    yearItem.x=year
                }

               
                if (splitVar == '') {
                    yearItem.group = 'global';
                } else {
                    yearItem.group = key;
                }


                if (globalLifex_cost_YearlyDistribution[key][year].value) {
                    yearItem.y = globalLifex_cost_YearlyDistribution[key][year].value;
                    cumul += globalLifex_cost_YearlyDistribution[key][year].value;
                }
                if ( globalLifex_cost_YearlyDistribution[key][year].capex>0 && splitVar!='Cost Type') {
                    yearItem.y=globalLifex_cost_YearlyDistribution[key][year].capex;
                    cumul += globalLifex_cost_YearlyDistribution[key][year].capex;
                    
                }   
                if(splitVar=='Cost Type'){
                    yearItem.group='phaseCost';
                }
                
                if (year == 'NA' || year == 'noYear') {
                    //yearItem.group = 'NA';
                    yearItem.x = "2020-01-01";
                }
                //xOffset:offsetCoeff[key],yOffset:Offsety
                if(!isDailyDistribution){
                    yearItem.label={content:parseInt(yearItem.y),xOffset:'10px',yOffset:10,className:'chartNumbers'};
                }
                
               
                chartItems.push(yearItem);
                
                if(splitVar=='Cost Type'){
                    var capexYearItem=JSON.parse(JSON.stringify(yearItem));
                    
                    capexYearItem.y = globalLifex_cost_YearlyDistribution[key][year].capex;
                    cumul += globalLifex_cost_YearlyDistribution[key][year].capex;
                    capexYearItem.group = 'CAPEX'
                    /*
                    if(splitVar==''){
                        capexYearItem.group ='global_capex'
                    }*/
                    if(!isDailyDistribution){
                        capexYearItem.label={content:parseInt(capexYearItem.y),xOffset:'10px',yOffset:10,className:'chartNumbers'};
                    }
                    
                    chartItems.push(capexYearItem);
                }
                    
                
                
            });


        }


        var dataset = new vis.DataSet(chartItems);
        /*drawPoints: {
                style: 'bar', 
                onRender: function (item, group, x, y, ctx) {
                    if (item && group) {
                        // Dessine la valeur au-dessus de la barre
                        ctx.font = '12px Arial';
                        ctx.fillStyle = 'black'; // Couleur du texte
                        ctx.fillText(item.y, x, y - 10); // Dessine la valeur au-dessus de chaque barre
                    }
                }
            },*/
        var options = {
            style: "bar",
            barChart: { width: 40, align: "right", sideBySide: true }, // align: left, center, right
            drawPoints: false,
            drawPoints: { 
                onRender:function(item, group) {
                    if (item.label === null) {
                    return false;
                    }
                    return {
                    style: "square",
                    size: 1,
                    
                    };
                },
            },
            orientation: "bottom",
            start: "2020-01-01",
            end: "2046-01-01",
            legend:{enabled:true,left:{position:'top-right'}},
            stack:true,

           

        }
        if(splitVar=='Cost Type'){
            options.stack=false;
        }
        if(!isDailyDistribution){
            options['timeAxis']={scale:'year',step:1},
            options['zoomMin']= 1000 * 60 * 60 * 24 * 365, // un an
            options['zoomMax']= 1000 * 60 * 60 * 24 * 365 * 28 //28 ans max sinon la légende n'est pas lisible
        }
        Lifex_cost_FiltersWidget.setTitle(parseInt(cumul));
        self.globalChart2d = new vis.Graph2d(container, chartItems, groups, options);
        if(!isDailyDistribution){
            self.globalChart2d.on('changed',function(){
                $('.vis-year2020.vis-text').html('No Year');
            })
            
        }
        self.generateColorLegend();
        self.globalChart2d.on("click", function (properties) {
            if (!properties) {
                return;
            } else if (properties.what == "legend") {

            } else if (properties.what == "background") {
                self.onChart2Dselect(properties);
            }
        });


    }
    self.generateColorLegend=function(){
        var index = 0;
        var styleSheetVisjsGroups = document.styleSheets[34];
        $(".vis-legend").find("rect").each(function() {
            var cssClass = $(this).attr("class").split(' ')[0];
            if ($(this).attr("height") == 11) {
                if (cssClass.startsWith("vis-graph-group")) {
                    //var color = self.legend.graph2dLegendClasses[cssClass];
                    //$("." + cssClass).attr("background-color", color);
                    //legendItems[index].className = cssClass + "-x";
                    if(parseInt(cssClass.split('vis-graph-group')[1])>13){
                        //generate class css rule
                        var color=self.generateRandomHexColor();
                        styleSheetVisjsGroups.insertRule(`.${cssClass} {
                                    fill: ${color};
                                    color: white;
                                    background-color: ${color};
                                    opacity: .9;
                                    fill-opacity: 0;
                                    stroke-width: 2px;
                                    stroke: ${color}
                        }`, styleSheetVisjsGroups.cssRules.length);
                    }
                    index++
    
                }
            }
        });
    }
    self.generateRandomHexColor=function () {
        // Générer un nombre aléatoire entre 0 et 16777215 (0xFFFFFF)
        const randomInt = Math.floor(Math.random() * 16777215);
        
        // Convertir le nombre en une chaîne hexadécimale et le préfixer avec #
        const hexColor = `#${randomInt.toString(16).padStart(6, '0')}`;
        
        return hexColor;
    };
    
    self.onChart2Dselect=function(properties){
        
        self.currentTimelineDate=properties;
        

      //  var date = new Date(properties.time).toISOString().replace("T", " ").substring(0, 10);
        var date =  new Date(properties.time);
        if(!self.isDailyDistribution){
            date=date.getFullYear()+'-01-01'
        }else{
            date.setHours(0, 0, 0, 0);
        }
        var group;
        var visjs_group=$(properties.event.target).attr('class')?.split(' ')[0];
        if(visjs_group && visjs_group.includes('vis-graph-group')){
             group=Lifex_cost_charts.globalChart2d.groupsData.get().filter(function(group){return group.className==visjs_group})[0].id;

            
        }
        var splitByvar=$('#Lifex_cost_SplitBySelect').val()
        if(splitByvar=='CAPEX'){
            group=null;
        }
        if(self.isDailyDistribution){
            self.drawResumeTableDate(date);
        }
        
        


        // Draw all JobCard 

        
        Lifex_cost_JobCardController.jobCardOnSelectedDate(date,group);

        // Lien vers autre JCs

    }

    self.drawResumeTableDate=function(date){
        var itemsData=self.globalChart2d.itemsData.get().filter(function(item){
            if(self.isDailyDistribution){ 
                
               return item.x==date.getTime()}
            else{return item.x==date} 
        });
        var BarResume={};
        var cumul=0;
        itemsData.forEach(function(item){
            BarResume[item.group]=item.y;
            cumul+=item.y

        });
        // Draw Bar resume
        if(date=='2020-01-01'){date='no Year'}
        var str=`<span style='font-weight:bold'> Values by Group At ${self.isDailyDistribution ? common.dateToRDFString(date) : date.replace('-01-01','')} </span>`; 
        str += "<table class='infosTable cell-border' style='margin-top:20px;'>";
        str+="<thead><tr class='infos_table'>";
        for (var key in BarResume){
            str +=
            "<th class='detailsCellName' style='padding: 4px 4px'>" +
            key+
            "</th>";
        }
        str +=
        "<th class='detailsCellName' style='padding: 4px 4px'>" +
        'Total'+
        "</th>";
        str+='</tr><tbody>';
        str+="<tr class='infos_table'>"
        Object.values(BarResume).forEach(function(yValue){
            str += "<td class='detailsCellName' style='padding: 4px 4px'>" +
            yValue.toFixed(2)
        +"</td>";
        })
        str += "<td class='detailsCellName' style='padding: 4px 4px'>" +
        cumul.toFixed(2)
        +"</td>";
        
       
        str+="</tr>";
        
        $("#Lifex_costTab_resumeDayTable").html(str);
        

        
    }
    return self;


})()
export default Lifex_cost_charts
window.Lifex_cost_charts=Lifex_cost_charts