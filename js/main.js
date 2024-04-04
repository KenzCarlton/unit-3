window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 900,
        height = 600;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAzimuthalEquidistant()
        .center([0, 44.7])
        .rotate([89.7, 0, 0])
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
        csvData = data[0];    
        states = data[1];
        wisc = data[2];    

        //translate wisconsin TopoJSON
        var surrounding = topojson.feature(states, states.objects.surr_states_p),
            wisconsin = topojson.feature(wisc, wisc.objects.agriculture_by_WIcounty).features;

        //add surrounding states to map
        var state = map.append("path")
            .datum(surrounding)
            .attr("class", "state")
            .attr("d", path);

        //add wisconsin counties to map
        var counties = map.selectAll(".counties")
            .data(wisconsin)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "counties " + d.properties.NAME;
            })
            .attr("d", path);
    };
}
