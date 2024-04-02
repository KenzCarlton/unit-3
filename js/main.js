//begin script when window loads
window.onload = function(){

    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAzimuthalEquidistant()
        .center([0, 44.8])
        .rotate([-2, 0, 0])
        .parallels([44, 45.5])
        .scale(2500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);
        
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/agriculture_by_WIcounty.csv")); //load attributes from csv    
    promises.push(d3.json("data/agriculture_by_WIcounty.topojson")); //load background spatial data    
    Promise.all(promises).then(callback);

    function callback(data){               
        csvData = data[0];    
        wisc = data[1];    
        
        //translate europe TopoJSON
        var wisconsin = topojson.feature(wisc, wisc.objects.agriculture_by_WIcounty)


        //add France regions to map
        var counties = map.selectAll(".counties")
            .data(agriculture_by_WIcounty)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "counties " + d.properties.adm1_code;
            })
            .attr("d", path);
    };
}
