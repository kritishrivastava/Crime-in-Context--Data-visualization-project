var ndx ;
var all ;
var crimeRecords;
var fullData;

queue()
    .defer(d3.json, "/test_db/test_collection1")
		.defer(d3.json, "static/geojson/us-states.json")
    .await(makeGraphs);
		
function makeGraphs(error, recordsJson, statesJson) {
	//Clean recordsJson data
	crimeRecords = recordsJson;
	var dateFormat = d3.time.format('%d-%m-%Y');
	crimeRecords.forEach(function(d) {
		d["Assaults"] = +d["Assaults"];
		d["Robberies"] = +d["Robberies"];
		d["Rapes"] = +d["Rapes"];
		d["Homicides"] = +d["Homicides"];
		d["Total Crimes"] = +d["Total Crimes"];
		d["Year"] = +d["Year"];
		d.month = +d["months_reported"];
		d.Population = +d.Population;
		d["Total crimes per capita"] = +d["Total crimes per capita"];
		d.cluster = +d.cluster;
		d.dd = dateFormat.parse(d.date);
    d.Month = d3.time.month(d.dd); // pre-calculate month for better performance
		d.xHeatMap = +d["Year"];
		d.yHeatMap = +d["months_reported"];
		d.colorHeatMap = +d["Total Crimes"];
		d.color2HeatMap = +d["Total crimes per capita"];
		d.lat = +d.lat;
		d.lng = +d.lng;
	});

	fullData = crimeRecords;
	//Create a Crossfilter instance
	ndx = crossfilter(crimeRecords);
	all = ndx.groupAll();
	
	xScatterLabel = "Total Crimes"
	//document.getElementById("x1scatter").checked = true; 
	xHeatMapLabel = "Year";
	yHeatMapLabel = "Month";
	colorHeatMapLabel = "Total crimes";
	document.getElementById("color1").checked = true; 
	
	drawUSMap(ndx,all,statesJson);
	drawTimeChart(ndx,all);
	drawScatterPlot(ndx,all);
	drawPieChart();
//	drawBoxPlot();
	drawAreaChart();
	drawLineChart(ndx,all,statesJson);
	drawCitiesScatterPlot();
	drawHeatMap();
	drawDataTable(ndx,all);
	drawSplom();
	dc.renderAll();
}

function drawUSMap(ndx, all,statesJson) {
	// US Map Choropleth
	var stateDim = ndx.dimension(function(d) { return d["State"]; });
	var totalCrimesByState = stateDim.group().reduceSum(function(d) {
		if(d["Total Crimes"] === NaN)
			return 0;
		else
			return d["Total Crimes"];
	});
	var max_state = totalCrimesByState.top(1)[0].value;
	var usChart = dc.geoChoroplethChart("#us-chart");
	usChart.width(1000)
	.height(330)
	.dimension(stateDim)
	.group(totalCrimesByState)
	.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
	.colorDomain([0, max_state])
	.colorCalculator(function (d) { return d ? usChart.colors()(d) : '#ccc'; })
	.overlayGeoJson(statesJson["features"], "State", function (d) {
		return d.properties.name;
	})
	.projection(d3.geo.albersUsa()
					.scale(700)
					.translate([400, 150]))
	.title(function (p) {
		if(p["value"]=== NaN || p["value"]=== undefined)
			return "State: " + p["key"]	+ "\n" + "Total Crimes: " + "No Data";
		else
			return "State: " + p["key"] + "\n" + "Total Crimes: " + intToString(p["value"],0);	
	})
	.on("renderlet", drawAdditionalStuffInMap);
}

function drawAdditionalStuffInMap(_chart) {
	var svg = _chart.svg();
	svg.selectAll("g.additionalStuff").remove();
	var group = svg.selectAll("g.additionalStuff");
	if (group.empty()) {
			group = svg.append("g").classed("additionalStuff", true);
	}
	var projection = d3.geo.albersUsa()
			.scale(700)
			.translate([400, 150]);
	var additionalNodes = group.selectAll("circle").data(fullData, function (x) {
			return x["_id"].$oid;
	});
	_chart.dimension().top(Infinity).map(function (d) {
			d.location = projection([+d.lng, +d.lat]);
			d.radius = d["Total crimes per capita"];
			return d;
	});
	// minRadius = 154;
	// maxRadius = 174542;
	minRadius = 16.49;
	maxRadius = 4352.83;
	var scale = d3.scale.linear().domain([ minRadius, maxRadius ]).range([ 1, 8 ]);
	additionalNodes.enter()
			.append("circle")
			.attr("x", 0)
			.attr("y", 0)
			.attr("r", function(d) {
				return scale(d.radius);
			})
			.style("fill", "rgb(217,91,67)")	
			.style("opacity", 0.2)	
			.attr("transform", function (d) {
					if(d.location === null || d.location === undefined)
					console.log("location null");
				else return "translate(" + d.location[0] + "," + d.location[1] + ")";
			});
			// .on("mouseover", function(d) {      
    	// div.transition()        
      	   // .duration(200)      
           // .style("opacity", .9);      
           // div.text("city name")
           // .style("left", (d3.event.pageX) + "px")     
           // .style("top", (d3.event.pageY - 28) + "px");    
			// })   
    // fade out tooltip on mouse out               
    // .on("mouseout", function(d) {       
        // div.transition()        
           // .duration(500)      
           // .style("opacity", 0);   
    // });
	additionalNodes.exit().remove();
}

function drawTimeChart(ndx,all){
	var dateDim = ndx.dimension(function(d) { return d.dd; });
	var monthsDim = ndx.dimension(function (d) {
			return d.Month;
	});
	var yearDim = ndx.dimension(function(d) { return d["Year"]; });
	var crimesByDateGroup = dateDim.group().reduceSum(function (d) {
			return d["Total Crimes"];
	 });
	//var crimesByDateGroup = dateDim.group(); 
	var crimesByMonthGroup = monthsDim.group().reduceSum(function (d) {
			return d["Total Crimes"];
	 });
	var crimesByYearGroup = yearDim.group().reduceSum(function (d) {
			return d["Total Crimes"];
	 });

	var minYear = yearDim.bottom(1)[0]["Year"];
	var maxYear = yearDim.top(1)[0]["Year"];
	var minDate = dateDim.bottom(1)[0]["dd"];
	var maxDate = dateDim.top(1)[0]["dd"];
	var timeChart = dc.barChart("#time-chart");
	timeChart
		.width(1000)
		.height(85)
		.margins({top: 0, right: 50, bottom: 35, left: 100})
		.dimension(dateDim)
		.group(crimesByDateGroup)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Select time range")
		.yAxis().ticks(0);
		
	// timeChart.width(1180) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
		// .height(40)
		// .margins({top: 0, right: 50, bottom: 20, left: 150})
		// .dimension(monthsDim)
		// .group(crimesByMonthGroup)
		// .centerBar(true)
		// .gap(1)
		// .x(d3.time.scale().domain([new Date(1975, 1, 1), new Date(2015, 12, 31)]))
		// .round(d3.time.month.round)
		// .alwaysUseRounding(true)
		// .xUnits(d3.time.months);		
		
		// timeChart.yAxis().ticks(0);
		
	 // timeChart.width(800) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
			// .height(60)
			// .margins({top: 0, right: 50, bottom: 20, left: 40})
			// .dimension(yearDim)
			// .group(crimesByYearGroup)
			// .centerBar(true)
			// .gap(1)
			// .transitionDuration(500)
			// .x(d3.scale.linear().domain([minYear,maxYear]))
			// .xAxis().tickFormat(d3.format("d"));
}

var colorScale = d3.scale.ordinal()
	.domain(["Safe", "Moderate", "Unsafe", "Very unsafe"])
	.range(["#72b431", "#ffdd4a", "#ff7631", "#ac0000"]);
	
function drawScatterPlot(ndx,all){
	var scatterPlotYLabel = "Total Crimes";
	var scatterplot = dc.scatterPlot('#scatterplot'), 
	xDimension = ndx.dimension(function(d){ return d.Population;}),
	yDimension = ndx.dimension(function(d){ return d[scatterPlotYLabel];}),
	scatterplotDimension = ndx.dimension(function(d){
		return [d.Population, d[scatterPlotYLabel],d.Type, d.City, d.Year];
	}),
	scatterplotGroup = scatterplotDimension.group();
	var minX = xDimension.bottom(1)[0]["Population"];
	var minY = yDimension.bottom(1)[0][scatterPlotYLabel];
	var maxX = xDimension.top(1)[0]["Population"];
	var maxY = yDimension.top(1)[0][scatterPlotYLabel];

	scatterplot.width(450)
		.height(290)
		.margins({top: 10, right: 5, bottom: 40, left: 40})
		.x(d3.scale.linear().domain([minX, maxX]))
		.y(d3.scale.linear().domain([minY, maxY]))
		.dimension(scatterplotDimension)
		.excludedOpacity(0.2)
		.group(scatterplotGroup)
		.mouseZoomable(true)
		.brushOn(false)
		.symbolSize(4)
		.renderHorizontalGridLines(true)
		.renderVerticalGridLines(true)
		.colors(function (d) {
			return colorScale(d);
		})
		.colorAccessor(function(d) {
			return d.key[2];
		})
		.title(function(d){ 
			return "City: " + d.key[3] +"\n" + "Year: " + d.key[4] +"\n" + "Type: " + d.key[2] + "\n" + "Population" + ": " + d.key[0] + "\n" + scatterPlotYLabel + ": " + d.key[1];
		})
		.xAxisLabel("Population")
		.yAxisLabel(scatterPlotYLabel)
		.renderTitle(true)
		 // .legend(dc.legend().x(350).y(350).itemHeight(13).gap(5).horizontal(1).legendWidth(140).itemWidth(70));
		// .xAxis().ticks(8)
		.xAxis().tickFormat(function(v) {return intToString(v, 0);});;
	scatterplot.yAxis().tickFormat(function(v) {return intToString(v, 0);})
	//document.getElementById("scatterplot-title").innerText = "Scatterplot: " + "Population" + " vs " + scatterPlotYLabel;
}

var xScatterLabel;

function drawCitiesScatterPlot(){
	var scatterPlotYLabel = "agency_jurisdiction";
	var scatterplot = dc.scatterPlot('#citiesScatterplot'), 
	citiesScatterplotDimension = ndx.dimension(function(d){
		return [d[xScatterLabel], cityIDs[d[scatterPlotYLabel]],d.Type];
	}),
	citiesScatterplotGroup = citiesScatterplotDimension.group();
	if(xScatterLabel === "Total Crimes"){
		var minX = 154;
		var maxX = 174542;
	}
	else{
		var minX = 16.49;
		var maxX = 4352.83;
	}

	scatterplot.width(500)
		.height(1015)
		.margins({top: 10, right: 5, bottom: 40, left: 135})
		.x(d3.scale.linear().domain([minX, maxX]))
		.y(d3.scale.linear().domain([1, 68]))
		.dimension(citiesScatterplotDimension)
		.excludedOpacity(0.2)
		.group(citiesScatterplotGroup)
		.mouseZoomable(true)
		.brushOn(false)
		.symbolSize(4)
		.renderHorizontalGridLines(true)
		.renderVerticalGridLines(true)
		.colors(function (d) {
			return colorScale(d);
		})
		.colorAccessor(function(d) {
			return d.key[2];
		})
		.title(function(d){ 
			var city = getCityByID(cityIDs,d.key[1]);
			if(xScatterLabel === "Total Crimes")
				return "City: " + city + "\n" + "Total crime" + ": " + d.key[0] + "\n" + "Type: " + d.key[2];
			else
				return "City: " + city + "\n" + "Total crimes per capita" + ": " + d.key[0] + "\n" + "Type: " + d.key[2];
		})
		.xAxisLabel(xScatterLabel)
	//	.yAxisLabel("Cities")
		.renderTitle(true)
	//	.legend(dc.legend().x(350).y(350).itemHeight(13).gap(5).horizontal(1).legendWidth(140).itemWidth(70));
		.xAxis().tickFormat(function(v) {return intToString(v, 0);});
		scatterplot.yAxis().tickFormat(function(v){
			return getCityByID(cityIDs,v);
		});
		scatterplot.yAxis().ticks(68);
}

function changeXScatter(xSelected){
	if( xSelected.value == "x1scatter"){
			xScatterLabel = "Total Crimes";
	}
	else if( xSelected.value == "x2scatter"){
			xScatterLabel = "Total crimes per capita";
	}
	drawCitiesScatterPlot();
	dc.renderAll();
}

function drawLineChart(ndx, all,statesJson) {
// Line Chart
	var compositeChart = dc.compositeChart("#line-chart");
	var lineDimension  = ndx.dimension(function(d){ return d["Year"];}),
			lineGroup1 = lineDimension.group().reduceSum(function(d){ return d["Rapes"];});
			lineGroup2 = lineDimension.group().reduceSum(function(d){ return d["Assaults"];});				
			lineGroup3 = lineDimension.group().reduceSum(function(d){ return d["Homicides"];});
			lineGroup4 = lineDimension.group().reduceSum(function(d){ return d["Robberies"];});
			lineGroup5 = lineDimension.group().reduceSum(function(d){ return d["Total Crimes"];});
			var minX = lineDimension.bottom(1)[0]["Year"];
			var maxX = lineDimension.top(1)[0]["Year"];

	domain = ["Rapes", "Assaults","Homicides","Robberies","Total Crimes"];
	
	compositeChart
		.width(1200)
		.height(300)
		.x(d3.scale.linear().domain([minX,maxX]))
		.margins({top: 10, right: 50, bottom: 40, left: 50})
		.transitionDuration(500)
		.renderHorizontalGridLines(true)
		.dimension(lineDimension)
		.brushOn(false)
		.mouseZoomable(true)
		.legend(dc.legend().x(980).y(20).itemHeight(13).gap(5))
		.xAxisLabel("Year")
		.yAxisLabel("Total Crimes")
		.compose([dc.lineChart(compositeChart)
								.dimension(lineDimension)
								.group(lineGroup1, "Rapes")
								.colors('#540D6E')
								.dashStyle([2,2]),
							dc.lineChart(compositeChart)
								.dimension(lineDimension)
								.colors('#95C623')
								.group(lineGroup2, "Assaults")
								.dashStyle([2,2]),
								dc.lineChart(compositeChart)
								.dimension(lineDimension)
								.group(lineGroup3, "Homicides")
								.colors('#EE4266')
								.dashStyle([2,2]),
							dc.lineChart(compositeChart)
								.dimension(lineDimension)
								.group(lineGroup4, "Robberies")
								.colors('#F2AF29')
								.dashStyle([2,2]),
								dc.lineChart(compositeChart)
								.dimension(lineDimension)
								.colors('#5BC0EB')
								.group(lineGroup5, "Total Crimes")
								.dashStyle([0,0])]);
		compositeChart.yAxis().tickFormat(function(v) {return intToString(v, 0);});
		compositeChart.xAxis().tickFormat(d3.format("d"));
		//document.getElementById("line-chart-title").innerText = "Line Chart: " + "Year" + " vs (" + "Rapes" + ", " + "Assaults" + ")"; 
};

function drawBoxPlot(){
	var boxPlot = dc.boxPlot("#boxplot");
	var typeDim = ndx.dimension(function(d) {return d.Type;});
	var crimesByTypeGroup = typeDim.group().reduce(
        function(p,v) {
          p.push(v["Total Crimes"]);
          return p;
        },
        function(p,v) {
          p.splice(p.indexOf(v["Total Crimes"]), 1);
          return p;
        },
        function() {
          return [];
        }
      );
  boxPlot
    .width(450)
    .height(550)
    .margins({top: 25, right: 10, bottom: 45, left: 35})
    .dimension(typeDim)
    .group(crimesByTypeGroup)
    .elasticY(true)
    .elasticX(true)
		.yAxis().tickFormat(function(v) {return intToString(v, 0);});
	boxPlot.yAxis().tickFormat(function(v) {return intToString(v, 0);});
	boxPlot.xAxisLabel("Type of city");
	boxPlot.yAxisLabel("Total Crimes");
}


// var heatMapColorScale = ["#dcffc9", "#0e3191"];
var heatMapColorScale = ["#AED6F1", "#1B4F72"];
var xHeatMapLabel;
var yHeatMapLabel;
var colorHeatMapLabel;
var monthArray = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

function drawHeatMap()
{
	var heatMap = dc.heatMap("#heatmap");
	var heatMapDimension = ndx.dimension(function(d) { return [ d.xHeatMap, d.yHeatMap]; }),
	heatMapGroup = heatMapDimension.group().reduceSum(function(d) { 
	if(colorHeatMapLabel == "Total crimes")
		return d.colorHeatMap; 
	else if(colorHeatMapLabel == "Total crimes per capita")
		return d.color2HeatMap;
	});

	var minCrimes=0;
	var maxCrimes=0;

	heatMap.width(1200)
		.height(300)
		.margins({top: 10, right: 70, bottom: 30, left: 48})
		.dimension(heatMapDimension)
		.group(heatMapGroup)
		.keyAccessor(function(d) { return +d.key[0]; })
		.valueAccessor(function(d) { return +d.key[1]; })
		.colorAccessor(function(d) { 
				if(minCrimes > +d.value) 
					minCrimes = +d.value;
				if(maxCrimes < +d.value)
					maxCrimes = +d.value;
				return +d.value; 
			})
		.xBorderRadius(0)
		.yBorderRadius(0)
		.colsLabel(function(d) {
		  return d;
		})
		.rowsLabel(function(d) {
			return monthArray[d-1];
		})
		.title(function(d) {
			if(colorHeatMapLabel == "Total crimes")
				return "Month:   " + monthArray[d.key[1]-1] + "\n" +
							 "Year:  " + d.key[0] + "\n" +
							 "Total crimes: " + 	intToString(d.value,0);
			else if(colorHeatMapLabel == "Total crimes per capita")
				return "Month:   " + monthArray[d.key[1]-1] + "\n" +
							 "Hour:  " + d.key[0] + "\n" +
							 "Total crimes per capita: " + 	intToString(d.value,0);			
		})
		.linearColors(heatMapColorScale)
		.calculateColorDomain();
		
	var range = maxCrimes - minCrimes;
	var heatArr = [];
	for (var i = 0; i < 25; i++) {
		heatArr.push({
			val: minCrimes + i / 24 * range,
			index: i
		});
	}
	var ndxHeatmapKey = crossfilter(heatArr);
	var keyHeatmap = ndxHeatmapKey.dimension(function(d) {
		return [d.index, 1];
	});
	var keyHeatmapGroup = keyHeatmap.group().reduceSum(function(d) {
		return d.val;
	});
	var heatmapChart = dc.heatMap("#heatmapKey");
	var heatColorMapping = function(d) {
		return d3.scale.linear().domain([minCrimes, maxCrimes]).range(heatMapColorScale)(d);
	};
	heatColorMapping.domain = function() {
		return [minCrimes, maxCrimes];
	};
	heatmapChart.width(1100)
				.height(75)
				.margins({top: 8, right: 5, bottom: 40, left: 120})
				.dimension(keyHeatmap)
				.group(keyHeatmapGroup)
				.colorAccessor(function(d) {
					return d.value;
				})
				.keyAccessor(function(d) { return d.key[0]; })
				.valueAccessor(function(d) { return d.key[1]; })
				.colsLabel(function(d){
					var col =  heatArr[d].val;
					return intToString(col, 0);
				})
				.rowsLabel(function(d) {
					return colorHeatMapLabel;
				})
				.transitionDuration(0)
				.colors(heatColorMapping)
				.calculateColorDomain();
	heatmapChart.xBorderRadius(0);
	heatmapChart.yBorderRadius(0);
}

function changeColorHeatmap(colorSelected){
	if( colorSelected.value == "color1"){
			colorHeatMapLabel = "Total crimes";
			document.getElementById("heatMapHeading").innerHTML = "Total violent crimes distribution over months";
			heatMapColorScale = ["#AED6F1", "#1B4F72"];
		//	heatMapColorScale = ["#dcffc9", "#0e3191"];
	}
	else if( colorSelected.value == "color2"){
			colorHeatMapLabel = "Total crimes per capita";
			document.getElementById("heatMapHeading").innerHTML = "Total Crimes per capita distribution over months";
			heatMapColorScale = ["#D2B4DE","#4A235A"];
			//heatMapColorScale = ["#ffe6e6", "#b30000"];
	}
	drawHeatMap();
	dc.renderAll();
}

var dataTableKey = "_id"
var 	allColumns = ['City','State','Year','month','Population','Rapes', 'Homicides', 'Assaults', 'Robberies','Total Crimes','Total crimes per capita'];
	
function drawDataTable(ndx,all){
	createDropDownList(ndx,all);
	var dataTable = dc.dataTable('#data-table'),
			dataDimension = ndx.dimension(function(d) { return d["dataTableKey"]; });
	dataTable
		.dimension(dataDimension)
		.group(function(d) { return ""})
		.size(10)
		.columns(allColumns)
		.order(d3.ascending)
		.sortBy(function (d) { return d[dataTableKey]; });		
}
function createDropDownList(ndx,all) {
	var out ="";
	for (var i = 0; i < allColumns.length; i++ ) {
			out += "<li><a id=\"sort-order\" href=\"#\" onclick=\"changeSortOrder("+i+")\">" + allColumns[i] + "</a></li>";
	}
	document.getElementById("sort-table").innerHTML = out;
}

function changeSortOrder(i) {
	dataTableKey = allColumns[i];
	drawDataTable(ndx, all);
	dc.renderAll();
}

function drawPieChart()
{
	var pieChartDimension = ndx.dimension(function(d) { 
				return d.Type;
			}),
	pieChartGroup = pieChartDimension.group().reduceCount();
	var pieChart = dc.pieChart('#piechart');
	pieChart
		.width(500)
		.height(110)
		.radius(55)
		.innerRadius(20)
		.externalLabels(20)
		.minAngleForLabel(0.5)
		.dimension(pieChartDimension)
		.group(pieChartGroup)
		.legend(dc.legend())
		.colors(function (d) {
			return colorScale(d);
		});
}

function drawAreaChart(){
	var areaChart = dc.lineChart('#areachart');
	var monthsDim = ndx.dimension(function (d) {
			return d.Month;
	});
	var yearDim = ndx.dimension(function(d) { return d["Year"]; });
	var crimesByMonthGroup = monthsDim.group().reduceSum(function (d) {
			return d["Total Crimes"];
	})
	var avgCrimeByMonthGroup = monthsDim.group().reduce(
        function (p, v) {
            ++p.days;
            p.total += v["Total Crimes"];
            p.avg = Math.round(p.total / p.days);
            return p;
        },
        function (p, v) {
            --p.days;
            p.total -= v["Total Crimes"];
            p.avg = p.days ? Math.round(p.total / p.days) : 0;
            return p;
        },
        function () {
            return {days: 0, total: 0, avg: 0};
        }
    );
	areaChart
		.renderArea(true)
		.width(1200)
		.height(200)
		.transitionDuration(1000)
		.margins({top: 30, right: 50, bottom: 40, left: 50})
		.dimension(monthsDim)
		.mouseZoomable(true)
		//.rangeChart(monthsDim)
		.xAxisLabel("Year")
		.yAxisLabel("Crimes Reported")
		.x(d3.time.scale().domain([new Date(1975, 1, 1), new Date(2015, 12, 31)]))
		.round(d3.time.month.round)
		.xUnits(d3.time.months)
		.elasticY(true)
		.renderHorizontalGridLines(true)
		.legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
		.brushOn(false)
		.group(avgCrimeByMonthGroup, 'Average Crime')
		.valueAccessor(function (d) {
            return d.value.avg;
        })
		.stack(crimesByMonthGroup, 'Total Crime', function (d) {
				return d.value;
			})
		.title(function (d) {
				var value = d.value.avg ? d.value.avg : d.value;
				if (isNaN(value)) {
						value = 0;
				}
				return 'Month: ' + d3.time.month(d.key).getMonth() + '\n' + 'Year: ' + d3.time.year(d.key).getFullYear() + '\n' + 'Crime: ' + intToString(value,0);
			//	return dateFormat(d.key) + '\n' + intToString(value,0);
		});	
	areaChart.yAxis().tickFormat(function(v) {return intToString(v, 0);})
		
}

function getCityByID(object,value){
	return Object.keys(object).find(key => object[key] === value);
}
		
function drawSplom()
{
	var fields = ['Rapes', 'Homicides', 'Assaults', 'Robberies'];
	var rows = ['heading'].concat(fields.slice(0).reverse()),
			cols = ['heading'].concat(fields);
	var data = ndx;
	function make_dimension(var1, var2) {
			return data.dimension(function(d) {
					return [d[var1], d[var2], d.Type];
			});
	}
	function key_part(i) {
			return function(kv) {
					return kv.key[i];
			};
	}
	var charts = [];
	d3.select('#content')
			.selectAll('tr').data(rows)
			.enter().append('tr').attr('class', function(d) {
					return d === 'heading' ? 'heading row' : 'row';
			})
			.each(function(row, y) {
					d3.select(this).selectAll('td').data(cols)
							.enter().append('td').attr('class', function(d) {
									return d === 'heading' ? 'heading entry' : 'entry';
							})
							.each(function(col, x) {
									var cdiv = d3.select(this).append('div')
									if(row === 'heading') {
											if(col !== 'heading')
													cdiv.text(col.replace('_', ' '))
											return;
									}
									else if(col === 'heading') {
											cdiv.text(row.replace('_', ' '))
											return;
									}
									cdiv.attr('class', 'chart-holder');
									var chart = dc.scatterPlot(cdiv);
									var dim = make_dimension(col,row),
											group = dim.group();
									var showYAxis = x === 1, showXAxis = y === 4;
									chart
											.transitionDuration(0)
											.width(115 + (showYAxis?30:0))
											.height(115 + (showXAxis?25:0))
											.margins({
													left: showYAxis ? 30 : 5,
													top: 5,
													right: 5,
													bottom: showXAxis ? 25 : 3
											})
											.dimension(dim).group(group)
											.keyAccessor(key_part(0))
											.valueAccessor(key_part(1))
											.colorAccessor(key_part(2))
											.colors(function (d) {
												return colorScale(d);
											})
											//.colorDomain(['Safe', 'Moderate','Unsafe', 'Very unsafe'])
											.x(d3.scale.linear()).xAxisPadding("0.001%")
											.y(d3.scale.linear()).yAxisPadding("0.001%")
											.brushOn(true)
											.elasticX(true)
											.elasticY(true)
											.symbolSize(7)
											.nonemptyOpacity(0.7)
											.emptySize(7)
											.emptyColor('#ccc')
											.emptyOpacity(0.7)
											.excludedSize(7)
											.excludedColor('#ccc')
											.excludedOpacity(0.7)
											.renderHorizontalGridLines(true)
											.renderVerticalGridLines(true);
									chart.xAxis().ticks(5);
									chart.yAxis().ticks(5);
									chart.xAxis().tickFormat(function(v) {return intToString(v, 0);});
									chart.yAxis().tickFormat(function(v) {return intToString(v, 0);});
									chart.on('postRender', function(chart) {
											// remove axes unless at left or bottom
											if(!showXAxis)
													chart.select('.x.axis').attr('display', 'none');
											if(!showYAxis)
													chart.select('.y.axis').attr('display', 'none');
											// remove clip path, allow dots to display outside
											chart.select('.chart-body').attr('clip-path', null);
									});
									// only filter on one chart at a time
									chart.on('filtered', function(_, filter) {
											if(!filter)
													return;
											charts.forEach(function(c) {
													if(c !== chart)
															c.filter(null);
											});
									});
									charts.push(chart);
							});
			});
}

function resetall(){
	dc.filterAll(); dc.renderAll();
}

function intToString (num, fixed) {
	if (num === null) { return null; } // terminate early
	if (num === 0) { return '0'; } // terminate early
	fixed = (!fixed || fixed < 0) ? 0 : fixed; // number of decimal places to show
	var b = (num).toPrecision(2).split("e"), // get power
			k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
			c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(1 + fixed), // divide by power
			d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
			e = d + ['', 'k', 'm', 'b', 't'][k]; // append power
	return e;
}

var div = d3.select("body")
		    .append("div")   
    		.attr("class", "tooltip")               
    		.style("opacity", 0);
				