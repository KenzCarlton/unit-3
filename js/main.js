(function(){

    //pseudo-global variables
    var attrArray = ["per_alfalf", "per_corn", "per_otherH", "per_peas", "per_potato", "per_soybea", "per_swtCor", "per_WWheat"];
    var expressed = attrArray[0]; //initial attribute

    //begin script when window loads
    window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = window.innerWidth * 0.375,
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
        .scale(6500)
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
        setChart(csvData, colorScale, "1");
        setChart(csvData, colorScale2, "2");

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
            return colorScale(d.properties[expressed]);
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
        var val = parseFloat(data[i][expressed]);
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
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

//function to create coordinated bar chart
function setChart(csvData, colorScale, n){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.555,
        chartHeight = window.innerHeight * .45;

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", `chart_${n}`);
};

})();