( function () {
  'use strict';


  angular.module('ngD3geo',[])
  .directive('2layerMap', function($parse, $window){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          topojsonPath: '@',
          width: '@',
          height: '@',
          id: '@',
          colorRange: '@',
          center: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

          var d3 = $window.d3;

          /* Initialize tooltip */
          var tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0])
            .html(function(d) { 
              return "<strong>Count:</strong> <span style='color:red'>" + d.z + "</span>";
            });

          var rawSvg = elem.find('svg');

          var svg = d3.select(rawSvg[0])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "outline: thin solid gray;");

          var g = svg.append('g').call(tip);
          var gBlocks = g.append("g").attr("id", "blocks");
          var gDistricts = g.append("g").attr("id", "districts");

          var projection = d3.geo.mercator()
            .center(scope.center.split(","))
            .scale(110000)
            .translate([width / 2, height / 2]);

          var path = d3.geo.path().projection(projection);

          var color = d3.scale.linear().domain([1,23])
                        .interpolate(d3.interpolateHcl)
                        .range(scope.colorRange.split(","));

          d3.json(scope.topojsonPath, function (error, json) {

            var districts = topojson.feature(json, json.objects['districts']);
            var blocks = topojson.feature(json, json.objects['blocks']);
            var mesh_districts = topojson.mesh(json, json.objects['districts'], function(a, b) { return a !== b; });

            // block polygons and boundary
            gBlocks.selectAll("path")
              .data(blocks.features)
              .enter().append("path")
              .attr("d", path)
              .attr("district-id", function(d) { 
                return d.properties.district_code; 
              })
              .attr("block-id", function(d) { 
                return d.properties.block_code; 
              })
              .attr("class", "block")
              .on("click", blockClicked);

            // district polygons
            gDistricts.selectAll("path")
              .data(districts.features)
              .enter().append("path")
              .attr("class", "district")
              .attr("d", path)
              .attr("fill", function(d,i) { 
                return color(i);
              })
              .attr("district-id", function(d) { 
                return d.properties.district_code; 
              })
              .on("click", districtClicked);

            // district border
            gDistricts.append("path")
              .datum(mesh_districts)
              .attr("d", path)
              .attr("class", "district-boundary");

            // district labels
            gDistricts.selectAll("text")
              .data(districts.features)
              .enter().append("text")
              .attr("class", "district-label")
              .attr("transform", function(d) { 
                return "translate(" + path.centroid(d) + ")"; 
              })
              .attr("dy", ".35em")
              .text(function(d) { return d.properties.district; })
              .attr("district-id", function(d) { 
                return d.properties.district_code; 
              })
              .on("click", labelClicked);

          });

          /***** click to zoom *****/
          var active = d3.select(null);

          var blockClicked = function(d) {

            if (active.node()) {
              if (this.getAttribute("district-id") == active.node().getAttribute("district-id")) {
                return reset();
              }
            }
          }

          var labelClicked = function(d) {
            var currentTagName = this.tagName;
            var prevTagName = "";
            var currentID = "";
            var prevID = "";

            if (active.node()) {
              prevTagName = active.node().tagName;
              if (this.getAttribute("district-id") == active.node().getAttribute("district-id")) {
                return reset();
              }
            }

            currentID = this.getAttribute("district-id");

            active.classed("active", false);
            active = g.selectAll(".district").filter(function(d) { 
              return d.properties.district_code == currentID;
            }).classed("active", true);

            zoom(d);
          }

          var districtClicked = function(d) {

            if (active.node() === this) {
              return reset();
            }

            active.classed("active", false);
            active = d3.select(this).classed("active", true);

            zoom(d);
          };

          var zoom = function(d) {
            var bounds = path.bounds(d),
                dx = bounds[1][0] - bounds[0][0],
                dy = bounds[1][1] - bounds[0][1],
                x = (bounds[0][0] + bounds[1][0]) / 2,
                y = (bounds[0][1] + bounds[1][1]) / 2,
                scale = .9 / Math.max(dx / width, dy / height),
                translate = [width / 2 - scale * x, height / 2 - scale * y];

            g.transition()
                .duration(750)
                .style("stroke-width", 1.5 / scale + "px")
                .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
          }

          var reset = function() {
            active.classed("active", false);
            active = d3.select(null);

            g.transition()
                .duration(750)
                .style("stroke-width", "1.5px")
                .attr("transform", "");
          };
          /***** click to zoom *****/

        }
     };
  })
  .directive('zoomPanMap', function($parse, $window){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          topojsonPath: '@',
          width: '@',
          height: '@',
          id: '@',
          colorRange: '@',
          center: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

          var d3 = $window.d3;

          /* Initialize tooltip */
          var tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0])
            .html(function(d) { 
              return "<strong>Count:</strong> <span style='color:red'>" + d.z + "</span>";
            });

          var rawSvg = elem.find('svg');

          var svg = d3.select(rawSvg[0])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "outline: thin solid gray;");

          var g = svg.append('g').call(tip);

          var projection = d3.geo.mercator()
            .center(scope.center.split(","))
            .scale(110000)
            .translate([width / 2, height / 2]);

          var path = d3.geo.path().projection(projection);

          var color = d3.scale.linear().domain([1,23])
                        .interpolate(d3.interpolateHcl)
                        .range(scope.colorRange.split(","));

          d3.json(scope.topojsonPath, function (error, json) {

            var districts = topojson.feature(json, json.objects['districts']);
            var mesh_districts = topojson.mesh(json, json.objects['districts'], function(a, b) { return a !== b; });


            // district polygons
            g.selectAll(".district")
              .data(districts.features)
              .enter().append("path")
              .attr("class", "district")
              .attr("d", path)
              .attr("fill", function(d,i) { 
                return color(i);
              })
              .attr("district-id", function(d) { 
                return d.properties.district_code; 
              });

            // district border
            g.append("path")
              .datum(mesh_districts)
              .attr("d", path)
              .attr("class", "district-boundary");

            // district labels
            g.selectAll(".district-label")
              .data(districts.features)
              .enter().append("text")
              .attr("class", "district-label")
              .attr("transform", function(d) { 
                return "translate(" + path.centroid(d) + ")"; 
              })
              .attr("dy", ".35em")
              .text(function(d) { return d.properties.district; })
              .attr("district-id", function(d) { 
                return d.properties.district_code; 
              });

          });

          /***** mouse zoom & pan *****/
          var t = projection.translate(); // the projection's default translation
          var s = projection.scale() // the projection's default scale
          var redraw = function () {
            // d3.event.translate (an array) stores the current translation from the parent SVG element
            // t (an array) stores the projection's default translation
            // we add the x and y vales in each array to determine the projection's new translation
            var tx = t[0] * d3.event.scale + d3.event.translate[0];
            var ty = t[1] * d3.event.scale + d3.event.translate[1];
            projection.translate([tx, ty]);
            // now we determine the projection's new scale, but there's a problem:
            // the map doesn't 'zoom onto the mouse point'
            projection.scale(s * d3.event.scale);
            // redraw the map
            g.selectAll("path").attr("d", path);
            g.selectAll("text").attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; });
          }
          svg.call(d3.behavior.zoom().on("zoom", redraw));
          /***** mouse zoom & pan *****/

        }
     };
  });
}() );