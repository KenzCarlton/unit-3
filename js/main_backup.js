(function(){

    //pseudo-global variables
    var attrArray = ["alfalfa", "corn", "other hay", "peas", "potatoes", "soybeans", "sweet corn", "winter wheat", "none"];
    var expressed1 = attrArray[6]; //initial attribute
    var expressed2 = attrArray[8]; //initial attribute
    var max = 0


    //begin script when window loads
    window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = window.innerWidth * 0.3875,
        height = width;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create equal area conic projection centered on WI
    var projection = d3.geoAzimuthalEquidistant()
        .center([0, 44.7])
        .rotate([89.9, 0, 0])
        .scale(width * 11.3)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/agriculture_percents.csv")); //load attributes from csv    
    promises.push(d3.json("data/surr_states_p.topojson")); //load choropleth spatial data    
    promises.push(d3.json("data/agriculture_by_WIcounty.topojson")); //load choropleth spatial data    
    Promise.all(promises).then(callback);

    function callback(data){               
        var csvData = data[0], states = data[1], wisc = data[2];    

        //translate wisconsin TopoJSON
        var surrounding = topojson.feature(states, states.objects.surr_states_p),
            wisconsin = topojson.feature(wisc, wisc.objects.agriculture_by_WIcounty).features;

        //add surrounding states to map
        var state = map.append("path")
            .datum(surrounding)
            .attr("class", "state")
            .attr("d", path);

        //join csv data to GeoJSON enumeration units
        wisconsin = joinData(wisconsin, csvData);

        var colorScale = makeColorScale(csvData);
        var colorScale2 = makeColorScale2(csvData);

        //add enumeration units to the map
        setEnumerationUnits(wisconsin, map, path, colorScale);

        //add coordinated visualization to the map
        setChart(csvData, colorScale, 1, expressed1);
        setChart(csvData, colorScale2, 2, expressed2);

        createDropdown(1);
        createDropdown(2);

    };
}; //end of setMap()

function joinData(wisconsin, csvData){
        //loop through csv to assign each set of csv attribute values to geojson state
        for (var i=0; i<csvData.length; i++){
            var csvState = csvData[i]; //the current state
            var csvKey = csvState.NAME; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a=0; a<wisconsin.length; a++){

                var geojsonProps = wisconsin[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.NAME; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){

                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvState[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };
        return wisconsin;
};

function setEnumerationUnits(wisconsin, map, path, colorScale){
    //add wisconsin counties to map
    var counties = map.selectAll(".counties")
        .data(wisconsin)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "counties " + d.properties.NAME;
        })
        .attr("d", path)
        .style("fill", function(d){
            var value = d.properties[expressed1];
            if (value > max)
                max = value;    
            var value2 = d.properties[expressed2];
            if (value2 > max)
                max = value2;
            
            return colorScale(d.properties[expressed1]);


        });
    };

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#edf8e9",
        "#c7e9c0",
        "#a1d99b",
        "#74c476",
        "#31a354",
        "#006d2c"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed1]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

function makeColorScale2(data){
    var colorClasses = [
        "#eff3ff",
        "#c6dbef",
        "#9ecae1",
        "#6baed6",
        "#3182bd",
        "#08519c"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed2]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

//function to create coordinated bar chart
function setChart(csvData, color, n, expressed){


    //create a second svg element to hold the bar chart
    var chart1 = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("id", `chart_${n}`);
    
    //set chart location (depends on whether this is the 1st or 2nd chart)
    const box = document.getElementById(`chart_${n}`);
    var top2 = window.innerHeight * .51;
    var top1 = 0;
    var left = window.innerWidth * .425;
    box.style.position = 'absolute';
    if (n == 1) {
        box.style.top = top1;
        box.style.left = left;
    } else if (n == 2){
        box.style.top = top2;
        box.style.left = left;
    };

    //create a rectangle for chart background fill
    var chartBackground = chart1.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //set domain based on max value of arrays used for both bar charts
    if (max>30){
        domainTop = Math.ceil(max+1);
    } else if (max > 10){
        domainTop = Math.ceil(max / 2)*2;
    } else if (max > 3.5){
        domainTop = Math.ceil(max * 2)/2;
    } else {
        domainTop = Math.ceil((max)*10)/10;
    };    
    
    //create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([chartInnerHeight, 0])
        .domain([0, domainTop]);

    //Example 2.4 line 8...set bars for each province
    var bars = chart1.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.NAME;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d){
            return chartInnerHeight - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return color(d[expressed]);
        });

    //create chart title with text sized based on screen size
    if (expressed !== "none"){
        var chartTitle = chart1.append("text")
            .attr("x", 60)
            .attr("y", 40)
            .attr("id", `chartTitle_${n}`)
            .attr("class", "chartTitle")
            .text("Percent of county land used to grow " + expressed + " in 2023");    
        document.getElementById(`chartTitle_${n}`).style.fontSize = `${chartInnerWidth / 500}em`;
    };

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart1.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart1.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};

//function to create a dropdown menu for attribute selection
function createDropdown(n){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .attr("id", `dropdown_${n}`);

    var menuText = ""
    if (n == 1) {
        menuText = "Select Main Attribute";
    } else if (n == 2){
        menuText = "Select Comparison";
    };
    
    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text(menuText);

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });

/*    //set menu location (depends on whether this is the 1st or 2nd menu)
    var menu = document.getElementById(`dropdown_${n}`);
    var topA = window.innerHeight * .61;
    var topB = 0;
    var left = window.innerWidth *9;
    menu.style.position = 'absolute';
    menu.style.left = left;
    if (n == 1) {
        menu.style.top = topA;
        console.log("test1")
    } else if (n == 2){
        menu.style.top = topB;
        menu.style.left = left;
        console.log("test2")

 
    }; */
};

})();
