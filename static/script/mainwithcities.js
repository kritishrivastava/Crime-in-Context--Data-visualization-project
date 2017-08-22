var ndx ;
var all ;

queue()
    .defer(d3.json, "/test_db/test_collection1")
		.defer(d3.json, "static/geojson/us-states.json")
    .await(makeGraphs);
		
function makeGraphs(error, recordsJson, statesJson) {
	//Clean recordsJson data
	var crimeRecords = recordsJson;
	var dateFormat = d3.time.format('%d-%m-%Y');
	crimeRecords.forEach(function(d) {
		d["assaults"] = +d["assaults"];
		d["robberies"] = +d["robberies"];
		d["rapes"] = +d["rapes"];
		d["homicides"] = +d["homicides"];
		d["violent_crimes"] = +d["violent_crimes"];
		d["report_year"] = +d["report_year"];
		d.reportedmonth = +d["months_reported"];
		d.population = +d.population;
		d.crimes_percapita = +d.crimes_percapita;
		d.cluster = +d.cluster;
		d.dd = dateFormat.parse(d.date);
    d.month = d3.time.month(d.dd); // pre-calculate month for better performance
		d.xHeatMap = +d["report_year"];
		d.yHeatMap = +d["months_reported"];
		d.colorHeatMap = +d["violent_crimes"];
		d.color2HeatMap = +d["crimes_percapita"];
	});

	//Create a Crossfilter instance
	ndx = crossfilter(crimeRecords);

	all = ndx.groupAll();
	drawUSMap(ndx,all,statesJson);
	//drawBubbleOverlay(ndx,all,statesJson);
//	drawGeoSpatialMap(ndx,all,statesJson);
	drawTimeChart(ndx,all);
	drawScatterPlot(ndx,all);
	drawPieChart();
	drawLineChart(ndx,all,statesJson);
	drawCitiesScatterPlot(ndx,all);
	document.getElementById("color1").checked = true; //heatmap
	xHeatMapLabel = "Year";
	yHeatMapLabel = "Month";
	colorHeatMapLabel = "Total crimes";
	drawHeatMap();
	drawDataTable(ndx,all);
	drawSplom();
	dc.renderAll();
}


/**
 * Created by nidhi on 20/04/17.
 */
function drawUSMap(ndx, all,statesJson) {
	// US Map Choropleth
	debugger;
	var stateDim = ndx.dimension(function(d) { return d["state"]; });
	var totalCrimesByState = stateDim.group().reduceSum(function(d) {
		if(d["violent_crimes"] === NaN)
			return 0;
		else
			return d["violent_crimes"];
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
	.overlayGeoJson(statesJson["features"], "state", function (d) {
		return d.properties.name;
	})
	.projection(d3.geo.albersUsa()
					.scale(600)
					.translate([340, 150]))
	.title(function (p) {
		if(p["value"]=== NaN || p["value"]=== undefined)
			return "State: " + p["key"]	+ "\n" + "Total Crimes: " + "No Data";
		else
			return "State: " + p["key"] + "\n" + "Total Crimes: " + intToString(p["value"],0);	
	})
	 .on("renderlet", drawAdditionalStuffInMap);
}
// function drawGeoSpatialMap(ndx, all,statesJson) {

    // var geoSpatialDimension = ndx.dimension(function (d) {
        // return d["state"];
    // });

    // var geoSpatialGroup = geoSpatialDimension.group().reduceSum(function(d) {
		// if(d["violent_crimes"] === NaN)
			// return 0;
		// else
			// return d["violent_crimes"];
	// });
    // var geoSpatialMap = dc.geoChoroplethChart("#us-chart");

    // geoSpatialMap.width(990)
        // .height(500)
        // .dimension(geoSpatialDimension)
        // .group(geoSpatialGroup)
        // .colors(d3.scale.quantize().range(
            // ["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
        // .colorDomain([0, 200])
        // .colorCalculator(function (d) {
            // return d ? geoSpatialMap.colors()(d) : '#ccc';
        // })
        // .overlayGeoJson(statesJson.features, "state", function (d) {
            // return d.properties.name;
        // })
        // .projection(d3.geo.albersUsa()
            // .scale(900)
            // .translate([500, 250]))
        // .on("renderlet", drawAdditionalStuffInMap);
// }

function drawAdditionalStuffInMap(_chart) {
    var svg = _chart.svg();
    svg.selectAll("g.additionalStuff").remove();

    var group = svg.selectAll("g.additionalStuff");

    if (group.empty()) {
        group = svg.append("g").classed("additionalStuff", true);
    }

    var projection = d3.geo.albersUsa()
        .scale(900)
        .translate([500, 250]);

    var additionalNodes = group.selectAll("circle").data(ndx, function (x) {
        return x["_id"];
    });

    _chart.dimension().top(Infinity).map(function (d) {
        d.location = projection([+d["long"], +d["lat"]]);
        return d;
    });

    additionalNodes.enter()
        .append("circle")
        .attr("x", 0)
        .attr("y", 0)
        .attr("r", 3)
        .attr("transform", function (d) {
            return "translate(" + d.location[0] + "," + d.location[1] + ")";
        });

    additionalNodes.exit().remove();
}




function drawUSMap(ndx, all,statesJson) {
	// US Map Choropleth
	var stateDim = ndx.dimension(function(d) { return d["state"]; });
	var totalCrimesByState = stateDim.group().reduceSum(function(d) {
		if(d["violent_crimes"] === NaN)
			return 0;
		else
			return d["violent_crimes"];
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
	.overlayGeoJson(statesJson["features"], "state", function (d) {
		return d.properties.name;
	})
	.projection(d3.geo.albersUsa()
					.scale(600)
					.translate([340, 150]))
	.title(function (p) {
		if(p["value"]=== NaN || p["value"]=== undefined)
			return "State: " + p["key"]	+ "\n" + "Total Crimes: " + "No Data";
		else
			return "State: " + p["key"] + "\n" + "Total Crimes: " + intToString(p["value"],0);	
	})
	// .geoPath().pointRadius(function(feature, index) {
            // var v = totalCrimesByState.all().filter(function(item) { return item.key === feature.id; })[0].value;
            // return (v == 0)? 0 : pointScale(v);
  // });
	
	dc.bubbleOverlay("#us-chart")
		.svg(d3.select("#us-chart svg"))
		.dimension(stateDim)
		.group(totalCrimesByState)
		.radiusValueAccessor(function(p) {
				//console.log(p);
				return p.val;
		})
		.r(d3.scale.linear().domain([0, 3]))
		.point("CA",200,200)
}

function drawBubbleOverlay(ndx,all,statesJson){
	
}

function drawTimeChart(ndx,all){
	var dateDim = ndx.dimension(function(d) { return d.dd; });
	var monthsDim = ndx.dimension(function (d) {
			return d.month;
	});
	var yearDim = ndx.dimension(function(d) { return d["report_year"]; });
	var crimesByDateGroup = dateDim.group().reduceSum(function (d) {
			return d["violent_crimes"];
	 });
	//var crimesByDateGroup = dateDim.group(); 
	var crimesByMonthGroup = monthsDim.group().reduceSum(function (d) {
			return d["violent_crimes"];
	 });
	var crimesByYearGroup = yearDim.group().reduceSum(function (d) {
			return d["violent_crimes"];
	 });

	var minYear = yearDim.bottom(1)[0]["report_year"];
	var maxYear = yearDim.top(1)[0]["report_year"];
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
	.domain(["safe", "moderate", "unsafe", "very unsafe"])
	.range(["#DDDDDD", "#5D2E8C", "#CCFF66", "#2EC4B6"]);
	
function drawScatterPlot(ndx,all){
	// Scatterplot
	var scatterPlotYLabel = "violent_crimes";
	var scatterplot = dc.scatterPlot('#scatterplot'), 
	xDimension = ndx.dimension(function(d){ return d.population;}),
	yDimension = ndx.dimension(function(d){ return d[scatterPlotYLabel];}),
	scatterplotDimension = ndx.dimension(function(d){
		return [d.population, d[scatterPlotYLabel],d.type];
	}),
	scatterplotGroup = scatterplotDimension.group();
	var minX = xDimension.bottom(1)[0]["population"];
	var minY = yDimension.bottom(1)[0][scatterPlotYLabel];
	var maxX = xDimension.top(1)[0]["population"];
	var maxY = yDimension.top(1)[0][scatterPlotYLabel];

	scatterplot.width(500)
		.height(300)
		.margins({top: 10, right: 50, bottom: 40, left: 40})
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
			return "Type: " + d.key[2] + "\n" + "Population" + ": " + d.key[0] + "\n" + scatterPlotYLabel + ": " + d.key[1];
		})
		.xAxisLabel("Population")
		.yAxisLabel(scatterPlotYLabel)
		.renderTitle(true)
		 // .legend(dc.legend().x(350).y(350).itemHeight(13).gap(5).horizontal(1).legendWidth(140).itemWidth(70));
		// .xAxis().ticks(8)
		.xAxis().tickFormat(function(v) {return intToString(v, 0);});;

	//document.getElementById("scatterplot-title").innerText = "Scatterplot: " + "Population" + " vs " + scatterPlotYLabel;
}

function drawCitiesScatterPlot(ndx,all){
	// Scatterplot
	var scatterPlotYLabel = "agency_jurisdiction";
	var scatterplot = dc.scatterPlot('#citiesScatterplot'), 
	xDimension = ndx.dimension(function(d){ return d["violent_crimes"];}),
	citiesScatterplotDimension = ndx.dimension(function(d){
		return [d["violent_crimes"], cityIDs[d[scatterPlotYLabel]],d.type];
	}),
	citiesScatterplotGroup = citiesScatterplotDimension.group();
	var minX = xDimension.bottom(1)[0]["violent_crimes"];
	var maxX = xDimension.top(1)[0]["violent_crimes"];

	scatterplot.width(700)
		.height(1000)
		.margins({top: 10, right: 50, bottom: 40, left: 150})
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
			return "City: " + city + "\n" + "Total crime" + ": " + d.key[0] + "\n" + "Type: " + d.key[2];
		})
		.xAxisLabel("Total Crime")
		.yAxisLabel("Cities")
		.renderTitle(true)
	//	.legend(dc.legend().x(350).y(350).itemHeight(13).gap(5).horizontal(1).legendWidth(140).itemWidth(70));
		.xAxis().tickFormat(function(v) {return intToString(v, 0);});
		scatterplot.yAxis().tickFormat(function(v){
			return getCityByID(cityIDs,v);
		});
		scatterplot.yAxis().ticks(68);

	//document.getElementById("scatterplot-title").innerText = "Scatterplot: " + "Crime" + " vs " + scatterPlotYLabel;
}

function drawLineChart(ndx, all,statesJson) {
// Line Chart
	var compositeChart = dc.compositeChart("#line-chart");
	var lineDimension  = ndx.dimension(function(d){ return d["report_year"];}),
			lineGroup1 = lineDimension.group().reduceSum(function(d){ return d["rapes"];});
			lineGroup2 = lineDimension.group().reduceSum(function(d){ return d["assaults"];});				
			lineGroup3 = lineDimension.group().reduceSum(function(d){ return d["homicides"];});
			lineGroup4 = lineDimension.group().reduceSum(function(d){ return d["robberies"];});
			lineGroup5 = lineDimension.group().reduceSum(function(d){ return d["violent_crimes"];});
			var minX = lineDimension.bottom(1)[0]["report_year"];
			var maxX = lineDimension.top(1)[0]["report_year"];

	domain = ["rapes", "assaults","homicides","robberies","violent_crimes"];
	
	compositeChart
		.width(1180)
		.height(300)
		.x(d3.scale.linear().domain([minX,maxX]))
		.margins({top: 10, right: 50, bottom: 40, left: 150})
		.transitionDuration(500)
		.renderHorizontalGridLines(true)
		.dimension(lineDimension)
		.brushOn(false)
		.mouseZoomable(true)
		.legend(dc.legend().x(980).y(20).itemHeight(13).gap(5))
		.xAxisLabel("Year")
		.compose([dc.lineChart(compositeChart)
								.dimension(lineDimension)
								.group(lineGroup1, "rapes")
								.colors('#540D6E')
								.dashStyle([2,2]),
							dc.lineChart(compositeChart)
								.dimension(lineDimension)
								.colors('#95C623')
								.group(lineGroup2, "assaults")
								.dashStyle([2,2]),
								dc.lineChart(compositeChart)
								.dimension(lineDimension)
								.group(lineGroup3, "homicides")
								.colors('#EE4266')
								.dashStyle([2,2]),
							dc.lineChart(compositeChart)
								.dimension(lineDimension)
								.group(lineGroup4, "robberies")
								.colors('#F2AF29')
								.dashStyle([2,2]),
								dc.lineChart(compositeChart)
								.dimension(lineDimension)
								.colors('#5BC0EB')
								.group(lineGroup5, "violent_crimes")
								.dashStyle([0,0])]);
		compositeChart.yAxis().tickFormat(function(v) {return intToString(v, 0);});
		compositeChart.xAxis().tickFormat(d3.format("d"));
		document.getElementById("line-chart-title").innerText = "Line Chart: " + "Year" + " vs (" + "Rapes" + ", " + "Assaults" + ")"; 
};

var heatMapColorScale = ["#dcffc9", "#0e3191"];
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
		.height(400)
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
							 "Total crimes: " + 	d.value;
			else if(colorHeatMapLabel == "Total crimes per capita")
				return "Month:   " + monthArray[d.key[1]-1] + "\n" +
							 "Hour:  " + d.key[0] + "\n" +
							 "Total crimes per capita: " + 	d.value;			
		})
		.linearColors(heatMapColorScale)
		.calculateColorDomain();
		
	var range = maxCrimes - minCrimes;
	var heatArr = [];
	for (var i = 0; i < 30; i++) {
		heatArr.push({
			val: minCrimes + i / 29 * range,
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
	heatmapChart.width(1150)
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
			document.getElementById("heatMapHeading").innerHTML = "HeatMap: Total Crimes for Year vs Month";
			heatMapColorScale = ["#dcffc9", "#0e3191"];
	}
	else if( colorSelected.value == "color2"){
			colorHeatMapLabel = "Total crimes per capita";
			document.getElementById("heatMapHeading").innerHTML = "HeatMap: Total Crimes per capita for Year vs Month";
			heatMapColorScale = ["#ffe6e6", "#b30000"];
			//["#dcffc9", "#0e3191"];	
	}
	drawHeatMap();
	dc.renderAll();
}

var dataTableKey = "_id"
var 	allColumns = ['city','state','report_year','rapes', 'homicides', 'assaults', 'robberies','violent_crimes'];
	
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
				return d.type;
			}),
	pieChartGroup = pieChartDimension.group().reduceCount();
	var pieChart = dc.pieChart('#piechart');
	pieChart
		.width(450)
		.height(325)
		.radius(100)
		.innerRadius(50)
		.externalLabels(55)
		.drawPaths(true)
		.minAngleForLabel(0.25)
		.dimension(pieChartDimension)
		.group(pieChartGroup)
		.legend(dc.legend())
		.colors(function (d) {
			return colorScale(d);
		})
		.on('pretransition', function(pieChart) {
		pieChart.selectAll('text.pie-slice').text(function(d) {
				return d.data.key;
		})
		});
}
function getCityByID(object,value){
	return Object.keys(object).find(key => object[key] === value);
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
		
		
function drawSplom()
{
	var fields = ['rapes', 'homicides', 'assaults', 'robberies'];
	var rows = ['heading'].concat(fields.slice(0).reverse()),
			cols = ['heading'].concat(fields);
	var data = ndx;
	function make_dimension(var1, var2) {
			return data.dimension(function(d) {
					return [d[var1], d[var2], d.type];
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
											.width(140 + (showYAxis?25:0))
											.height(140 + (showXAxis?20:0))
											.margins({
													left: showYAxis ? 25 : 8,
													top: 5,
													right: 0,
													bottom: showXAxis ? 20 : 5
											})
											.dimension(dim).group(group)
											.keyAccessor(key_part(0))
											.valueAccessor(key_part(1))
											.colorAccessor(key_part(2))
											.colorDomain(['safe', 'moderate','unsafe', 'very unsafe'])
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
									chart.xAxis().ticks(6);
									chart.yAxis().ticks(6);
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
		

