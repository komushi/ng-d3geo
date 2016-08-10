( function () {
  'use strict';

  function findprop(obj, path) {
      // if(path == "id"){
      //   console.log(obj);
      // }

      var args = path.split('.'), i, l;

      for (i=0, l=args.length; i<l; i++) {
          if (!obj.hasOwnProperty(args[i]))
              return;
          obj = obj[args[i]];
      }

      return obj;
  }

  angular.module('ngD3geo',['rx'])
  .directive('staticMap', function($parse, $window, observeOnScope){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          id: '@',
          topojsonPath: '@',
          width: '@',
          height: '@',
          bgColor: '@',
          colorRange: '@',
          center: '@',
          scale: '@',
          layerObjects: '@',
          layerFeatureName: '@',
          layerFeatureCode: '@',
          featureNameStyle: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

          var d3 = $window.d3;

          var rawSvg = elem.find('svg');

          var svg = d3.select(rawSvg[0])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "outline: thin solid gray;");

          var g = svg.append('g');

          var projection = d3.geo.mercator()
            .center(scope.center.split(","))
            .scale(scope.scale)
            .translate([width / 2, height / 2]);

          var path = d3.geo.path().projection(projection);

          d3.json(scope.topojsonPath, function (error, json) {

            var layerFeatues = topojson.feature(json, json.objects[scope.layerObjects]).features;
            var mesh = topojson.mesh(json, json.objects[scope.layerObjects], function(a, b) { return a !== b; });

            var color = d3.scale.linear().domain([1,layerFeatues.length])
                          .interpolate(d3.interpolateHcl)
                          .range(scope.colorRange.split(","));
                          
            if (scope.featureNameStyle == 'static') {
              // polygons
              g.selectAll("path")
                .data(layerFeatues)
                .enter().append("path")
                .attr("class", "layer1")
                .attr("d", path)
                .attr("fill", function(d,i) { 
                  return color(i + 1);
                })
                .attr("layer-feature-code", function(d) {
                  return findprop(d, scope.layerFeatureCode);
                })
                .attr("layer-feature-name", function(d) {
                  return findprop(d, scope.layerFeatureName);
                });

              // border
              g.append("path")
                .datum(mesh)
                .attr("d", path)
                .attr("class", "layer1-boundary");

              // Layer1 labels
              g.selectAll("text")
                .data(layerFeatues)
                .enter().append("text")
                .attr("class", "label")
                .attr("transform", function(d) { 
                  return "translate(" + path.centroid(d) + ")"; 
                })
                .attr("dy", ".35em")
                .text(function(d) { 
                  return findprop(d, scope.layerFeatureName); 
                })
                .attr("layer-feature-code", function(d) { 
                  return findprop(d, scope.layerFeatureCode);
                });
            } else if (scope.featureNameStyle == 'hover') {

              var mouseover = function(p) {
                // console.log(this.tagName);


                g.selectAll("text")
                  .filter(function(d){
                    return findprop(p, scope.layerFeatureCode) == findprop(d, scope.layerFeatureCode);
                  })
                  .transition()
                  .duration(200)
                  .style("fill-opacity", 1)
                  .style("display", "block");
              }
              
              var mouseout = function (p) {

                g.selectAll("text")
                  .filter(function(d){
                    return findprop(p, scope.layerFeatureCode) == findprop(d, scope.layerFeatureCode);
                  })
                  .transition()
                  .duration(200)
                  .style("fill-opacity", 0)
                  .transition()
                  .style("display", "none");
              }

              // polygons
              g.selectAll("path")
                .data(layerFeatues)
                .enter().append("path")
                .attr("class", "layer1")
                .attr("d", path)
                .attr("fill", function(d,i) { 
                  return color(i + 1);
                })
                .attr("layer-feature-code", function(d) {
                  return findprop(d, scope.layerFeatureCode);
                })
                .attr("layer-feature-name", function(d) {
                  return findprop(d, scope.layerFeatureName);
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);

              // border
              g.append("path")
                .datum(mesh)
                .attr("d", path)
                .attr("class", "layer1-boundary");

              // Layer1 labels
              g.selectAll("text")
                .data(layerFeatues)
                .enter().append("text")
                .attr("class", "label")
                .style("fill-opacity", 0)
                .style("display", "none")
                .attr("transform", function(d) { 
                  // return "translate(" + [path.centroid(d)[0], path.centroid(d)[1] - 20] + ")"; 
                  return "translate(" + path.centroid(d) + ")"; 
                })
                // .attr("dy", ".35em")
                .attr("dy", "-1em")
                .attr("pointer-events", "none")
                .text(function(d) { 
                  return findprop(d, scope.layerFeatureName); 
                })
                .attr("layer-feature-code", function(d) { 
                  return findprop(d, scope.layerFeatureCode);
                });
            } else {
              var color = d3.scale.linear().domain([1,layerFeatues.length])
                            .interpolate(d3.interpolateHcl)
                            .range(scope.colorRange.split(","));

              // polygons
              g.selectAll("path")
                .data(layerFeatues)
                .enter().append("path")
                .attr("class", "layer1")
                .attr("d", path)
                .attr("fill", function(d,i) { 
                  return color(i + 1);
                });

              // border
              g.append("path")
                .datum(mesh)
                .attr("d", path)
                .attr("class", "layer1-boundary");
            }
          });
        }
     };
  })
  .directive('2layerMap', function($parse, $window, observeOnScope){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          id: '@',
          topojsonPath: '@',
          width: '@',
          height: '@',
          layer1ColorRange: '@',
          center: '@',
          scale: '@',
          layer1Objects: '@',
          layer2Objects: '@',
          layer1FeatureName: '@',
          layer1FeatureCode: '@',
          layer2FeatureName: '@',
          layer2FeatureCode: '@',
          onReceiveEvents: '&',
          onStopEvents: '&'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

          var d3 = $window.d3;

          var rawSvg = elem.find('svg');

          var svg = d3.select(rawSvg[0])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "outline: thin solid gray;");

          svg.append("rect")
                        .attr("class", "background")
                        .attr("width", width)
                        .attr("height", height)
                        .on("click", reset);

          var g = svg.append('g');
          var gLayer2 = g.append("g").attr("id", scope.layer2Objects);
          var gLayer1 = g.append("g").attr("id", scope.layer1Objects);
          var gLabelLayer2 = g.append("g").attr("id", scope.layer2Objects + "_label");
          var gLabelLayer1 = g.append("g").attr("id", scope.layer1Objects + "_label");

          var projection = d3.geo.mercator()
            .center(scope.center.split(","))
            .scale(scope.scale)
            .translate([width / 2, height / 2]);

          var path = d3.geo.path().projection(projection);

          d3.json(scope.topojsonPath, function (error, json) {

            var layer1Featues = topojson.feature(json, json.objects[scope.layer1Objects]).features;
            var layer2Featues = topojson.feature(json, json.objects[scope.layer2Objects]).features;
            var meshLayer1 = topojson.mesh(json, json.objects[scope.layer1Objects], function(a, b) { return a !== b; });

            var color = d3.scale.linear().domain([1,layer1Featues.length])
                          .interpolate(d3.interpolateHcl)
                          .range(scope.layer1ColorRange.split(","));

            // layer2 polygons and boundary
            gLayer2.selectAll("path")
              .data(layer2Featues)
              .enter().append("path")
              .attr("d", path)
              .attr("layer1-feature-code", function(d) {
                return findprop(d, scope.layer1FeatureCode);
              })
              .attr("layer1-feature-name", function(d) {
                return findprop(d, scope.layer1FeatureName);
              })
              .attr("layer2-feature-code", function(d) { 
                return findprop(d, scope.layer2FeatureCode);
              })
              .attr("layer2-feature-name", function(d) { 
                return findprop(d, scope.layer2FeatureName);
              })
              .attr("class", "layer2")
              .on("click", layer2Clicked)
              .on("mouseover", mouseoverLayer2)
              .on("mouseout", mouseoutLayer2);

            // Layer2 labels
            gLabelLayer2.selectAll("text")
              .data(layer2Featues)
              .enter().append("text")
              .attr("class", "label")
              .style("fill-opacity", 0)
              .style("display", "none")
              .attr("transform", function(d) { 
                return "translate(" + path.centroid(d) + ")"; 
              })
              .attr("dy", "-1em")
              .attr("pointer-events", "none")
              .text(function(d) { 
                return findprop(d, scope.layer2FeatureName); 
              })
              .attr("layer2-feature-code", function(d) { 
                return findprop(d, scope.layer2FeatureCode);
              });

            // Layer1 polygons
            gLayer1.selectAll("path")
              .data(layer1Featues)
              .enter().append("path")
              .attr("class", "layer1")
              .attr("d", path)
              .attr("fill", function(d,i) { 
                return color(i + 1);
              })
              .attr("layer1-feature-code", function(d) {
                return findprop(d, scope.layer1FeatureCode);
              })
              .attr("layer1-feature-name", function(d) {
                return findprop(d, scope.layer1FeatureName);
              })
              .on("click", layer1Clicked);

            // Layer1 border
            gLayer1.append("path")
              .datum(meshLayer1)
              .attr("d", path)
              .attr("class", "layer1-boundary");

            // Layer1 labels
            gLabelLayer1.selectAll("text")
              .data(layer1Featues)
              .enter().append("text")
              .attr("class", "label")
              .attr("transform", function(d) { 
                return "translate(" + path.centroid(d) + ")"; 
              })
              .attr("dy", ".35em")
              .text(function(d) { 
                return findprop(d, scope.layer1FeatureName); 
              })
              .attr("layer1-feature-code", function(d) { 
                return findprop(d, scope.layer1FeatureCode);
              })
              .on("click", labelClicked);

          });

          /***** click to zoom *****/
          var active = d3.select(null);

          var layer2Clicked = function(d) {
            if (active.node()) {
              if (this.getAttribute("layer1-feature-code") == active.node().getAttribute("layer1-feature-code")) {
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
              if (this.getAttribute("layer1-feature-code") == active.node().getAttribute("layer1-feature-code")) {
                return reset();
              }
            }

            currentID = this.getAttribute("layer1-feature-code");

            active.classed("active", false);
            active = g.selectAll(".layer1").filter(function(d) { 
              return findprop(d, scope.layer1FeatureCode) == currentID;
            }).classed("active", true);

            zoom(d);
          }

          var layer1Clicked = function(d) {
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

            // hide layer1 labels
            gLabelLayer1.selectAll('text')
              .transition()
              .duration(250)
              .style("fill-opacity", 0)
              .transition()
              .style("display", "none");

            // callback to notify the specified feature is ready to receive location events
            var featureCode = findprop(d, scope.layer1FeatureCode);
            scope.onStopEvents();
            scope.onReceiveEvents({feature: featureCode});
          }

          function reset() {
            active.classed("active", false);
            active = d3.select(null);

            g.transition()
              .duration(750)
              .style("stroke-width", "1.5px")
              .attr("transform", "");

            // show layer1 labels
            gLabelLayer1.selectAll('text')
              .transition()
              .style("display", "block")
              .transition()
              .duration(250)
              .style("fill-opacity", 1);

            scope.onStopEvents();
          };
          /***** click to zoom *****/

          /***** hover *****/
          var mouseoverLayer2 = function(p) {
            gLabelLayer2.selectAll("text")
              .filter(function(d){
                return findprop(p, scope.layer2FeatureCode) == findprop(d, scope.layer2FeatureCode);
              })
              .transition()
              .duration(200)
              .style("fill-opacity", 1)
              .style("display", "block");
          }
          
          var mouseoutLayer2 = function (p) {
            gLabelLayer2.selectAll("text")
              .filter(function(d){
                return findprop(p, scope.layer2FeatureCode) == findprop(d, scope.layer2FeatureCode);
              })
              .transition()
              .duration(200)
              .style("fill-opacity", 0)
              .transition()
              .style("display", "none");
          }
          /***** hover *****/

          /***** event data *****/
          var duration = 1500;

          var styleCircle = g.selectAll('circle');

          var visualizeEvents = function(data) {
            styleCircle
                .data(data)
                .enter().append('circle')
                .style('opacity', 0)
                .attr("class", "circle")
                .attr('cx', function(d) { 
                  return projection(d)[0];
                })
                .attr('cy', function(d) { 
                  return projection(d)[1];
                })
                .attr('r', 1)
              .transition()
                .delay(function(d,i) { return i * 100; })
                .duration(duration)
                .style('opacity', 1)
              .transition()
                .delay(function(d,i) { return i * 100 + duration + 100; })
                .duration(duration)
                .style('opacity', 0)
                .remove();
          }

          // rx observeOnScope for data changes and re-render
          observeOnScope(scope, 'data').subscribe(function(change) {
            if (change.newValue && change.oldValue) {
              return visualizeEvents(change.newValue);
            }
          }); 
          /***** event data *****/

        }
     };
  })
  .directive('eventsMap', function($parse, $window, observeOnScope, $q){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          id: '@',
          topojsonPath: '@',
          width: '@',
          height: '@',
          bgColor: '@',
          colorRange: '@',
          center: '@',
          scale: '@',
          layerObjects: '@',
          layerFeatureName: '@',
          layerFeatureCode: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

          var d3 = $window.d3;

          var rawSvg = elem.find('svg');

          var svg = d3.select(rawSvg[0])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "outline: thin solid gray;");

          var g = svg.append('g');
          var gLayer = g.append("g").attr("id", scope.layerObjects);
          var gLabelLayer = g.append("g").attr("id", scope.layerObjects + "_label");

          var projection = d3.geo.mercator()
            .center(scope.center.split(","))
            .scale(scope.scale)
            .translate([width / 2, height / 2]);

          var path = d3.geo.path().projection(projection);

          d3.json(scope.topojsonPath, function (error, json) {

            var layerFeatues = topojson.feature(json, json.objects[scope.layerObjects]).features;
            var mesh = topojson.mesh(json, json.objects[scope.layerObjects], function(a, b) { return a !== b; });

            // polygons
            gLayer.selectAll("path")
              .data(layerFeatues)
              .enter().append("path")
              .attr("class", "layer1")
              .attr("d", path)
              .attr("fill", scope.bgColor)
              .attr("layer-feature-code", function(d) {
                return findprop(d, scope.layerFeatureCode);
              });

            // border
            gLayer.append("path")
              .datum(mesh)
              .attr("d", path)
              .attr("class", "layer1-boundary");

            // Layer1 labels
            gLabelLayer.selectAll("text")
              .data(layerFeatues)
              .enter()
              .append("text")
              .attr("class", "label")
              .attr("transform", function(d) { 
                return "translate(" + path.centroid(d) + ")"; 
              })
              .attr("dy", "-1em");

            /***** event data *****/
            var endall = function(transition, callback) { 
              var n = 0; 
              transition 
                .each(function() { ++n; }) 
                .each("end", function() { if (!--n) callback.apply(this, arguments); }); 
            }

            var showFeatureNames = function(newFeatureCodes) {
              var color = d3.scale.linear().domain([1, newFeatureCodes.length])
                            .interpolate(d3.interpolateHcl)
                            .range(scope.colorRange.split(","));

              gLabelLayer.selectAll("text")
                .filter(function(d){
                  return newFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode)) > -1;
                })
                .text(function(d){
                  return findprop(d, scope.layerFeatureName);
                })
                .transition()
                .style("fill-opacity", 1)
                .style("display", "block")
                .style("fill", function(d,i) {
                  d.showname = true;
                  var index = newFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode));
                  return color(index + 1);
                });
            }

            var hideFeatureNames = function() {

              var dfd = $q.defer();

              var highlightData = gLabelLayer.selectAll("text")
                .filter(function(d){
                  return d.hasOwnProperty("showname");
                });

              if (highlightData.size() == 0) {
                dfd.resolve();
              } else {
                highlightData
                  .transition()
                  .style("fill-opacity", 0)
                  .transition()
                  .text(function(d){
                    if (d.hasOwnProperty("showname")) {
                      delete d.showname;
                    }
                    return "";
                  })
                  .attr("style", null)
                  .call(endall, function() {
                    dfd.resolve();
                  });
              }

              return dfd.promise;

            }

            var dehighlightFeatures = function(oldFeatureCodes) {
              
              var dfd = $q.defer();

              var highlightData = gLayer.selectAll("path")
                    .filter(function(d){
                      return d.hasOwnProperty("highlight");
                    });

              if (highlightData.size() == 0) {
                dfd.resolve();
              } else {
                highlightData
                  .transition()
                  .attr("fill", function(d){
                    delete d.highlight;
                    return scope.bgColor;
                  })
                  .call(endall, function() {
                    dfd.resolve();
                  });                
              }

              return dfd.promise;
            }

            var highlightFeatures = function(newFeatureCodes) {

              var color = d3.scale.linear().domain([1, newFeatureCodes.length])
                            .interpolate(d3.interpolateHcl)
                            .range(scope.colorRange.split(","));


              gLayer.selectAll("path")
                .filter(function(d){
                  return newFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode)) > -1;
                })
                .transition()
                .attr("fill", function(d,i) {
                  d.highlight = true;
                  var index = newFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode));
                  return color(index + 1);
                });
            }

            // rx observeOnScope for data changes and re-render
            observeOnScope(scope, 'data').subscribe(function(change) {
         
              hideFeatureNames().then(function () {
                  if (change.newValue) {
                    showFeatureNames(change.newValue);
                  }  
                });

              dehighlightFeatures().then(function () {
                  if (change.newValue) {
                    highlightFeatures(change.newValue);
                  }  
                });
    
            }); 
            /***** event data *****/

          });
        }
     };
  })
  .directive('zoomPanMap', function($parse, $window){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          id: '@',
          topojsonPath: '@',
          width: '@',
          height: '@',
          colorRange: '@',
          center: '@',
          scale: '@',
          layerObjects: '@',
          layerFeatureName: '@',
          layerFeatureCode: '@',
          featureNameStyle: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

          var d3 = $window.d3;

          var rawSvg = elem.find('svg');

          var svg = d3.select(rawSvg[0])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "outline: thin solid gray;");

          var g = svg.append('g');

          var projection = d3.geo.mercator()
            .center(scope.center.split(","))
            .scale(scope.scale)
            .translate([width / 2, height / 2]);

          var path = d3.geo.path().projection(projection);

          d3.json(scope.topojsonPath, function (error, json) {

            var layerFeatues = topojson.feature(json, json.objects[scope.layerObjects]).features;
            var mesh = topojson.mesh(json, json.objects[scope.layerObjects], function(a, b) { return a !== b; });

            var color = d3.scale.linear().domain([1,layerFeatues.length])
                          .interpolate(d3.interpolateHcl)
                          .range(scope.colorRange.split(","));

            if (scope.featureNameStyle == 'hover') {

              var mouseover = function(p) {
                // console.log(this.tagName);


                g.selectAll("text")
                  .filter(function(d){
                    return findprop(p, scope.layerFeatureCode) == findprop(d, scope.layerFeatureCode);
                  })
                  .transition()
                  .duration(200)
                  .style("fill-opacity", 1)
                  .style("display", "block");
              }
              
              var mouseout = function (p) {

                g.selectAll("text")
                  .filter(function(d){
                    return findprop(p, scope.layerFeatureCode) == findprop(d, scope.layerFeatureCode);
                  })
                  .transition()
                  .duration(200)
                  .style("fill-opacity", 0)
                  .transition()
                  .style("display", "none");
              }

              // polygons
              g.selectAll("path")
                .data(layerFeatues)
                .enter().append("path")
                .attr("class", "layer1")
                .attr("d", path)
                .attr("fill", function(d,i) { 
                  return color(i + 1);
                })
                .attr("layer-feature-code", function(d) {
                  return findprop(d, scope.layerFeatureCode);
                })
                .attr("layer-feature-name", function(d) {
                  return findprop(d, scope.layerFeatureName);
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);

              // border
              g.append("path")
                .datum(mesh)
                .attr("d", path)
                .attr("class", "layer1-boundary");

              // Layer1 labels
              g.selectAll("text")
                .data(layerFeatues)
                .enter().append("text")
                .attr("class", "label")
                .style("fill-opacity", 0)
                .style("display", "none")
                .attr("transform", function(d) { 
                  // return "translate(" + [path.centroid(d)[0], path.centroid(d)[1] - 20] + ")"; 
                  return "translate(" + path.centroid(d) + ")"; 
                })
                // .attr("dy", ".35em")
                .attr("dy", "-1em")
                .attr("pointer-events", "none")
                .text(function(d) { 
                  return findprop(d, scope.layerFeatureName); 
                })
                .attr("layer-feature-code", function(d) { 
                  return findprop(d, scope.layerFeatureCode);
                });
            } else if (scope.featureNameStyle == 'static') {
              // polygons
              g.selectAll("path")
                .data(layerFeatues)
                .enter().append("path")
                .attr("class", "layer1")
                .attr("d", path)
                .attr("fill", function(d,i) { 
                  return color(i + 1);
                })
                .attr("layer-feature-code", function(d) {
                  return findprop(d, scope.layerFeatureCode);
                })
                .attr("layer-feature-name", function(d) {
                  return findprop(d, scope.layerFeatureName);
                });

              // border
              g.append("path")
                .datum(mesh)
                .attr("d", path)
                .attr("class", "layer1-boundary");

              // Layer1 labels
              g.selectAll("text")
                .data(layerFeatues)
                .enter().append("text")
                .attr("class", "label")
                .attr("transform", function(d) { 
                  return "translate(" + path.centroid(d) + ")"; 
                })
                .attr("dy", ".35em")
                .text(function(d) { 
                  return findprop(d, scope.layerFeatureName); 
                })
                .attr("layer-feature-code", function(d) { 
                  return findprop(d, scope.layerFeatureCode);
                });
            } else {
              // polygons
              g.selectAll("path")
                .data(layerFeatues)
                .enter().append("path")
                .attr("class", "layer1")
                .attr("d", path)
                .attr("fill", function(d,i) { 
                  return color(i + 1);
                });

              // border
              g.append("path")
                .datum(mesh)
                .attr("d", path)
                .attr("class", "layer1-boundary");
            }
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
            g.selectAll("text").attr("transform", function(d) { 
              return "translate(" + path.centroid(d) + ")scale(" + d3.event.scale + ")"; 
            });
          }

          svg.call(d3.behavior.zoom().on("zoom", redraw));
          /***** mouse zoom & pan *****/
        }
     };
  })
  .directive('routeEventsMap', function($parse, $window, observeOnScope, $q){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          id: '@',
          topojsonPath: '@',
          width: '@',
          height: '@',
          bgColor: '@',
          colorRange: '@',
          center: '@',
          scale: '@',
          layerObjects: '@',
          layerFeatureName: '@',
          layerFeatureCode: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

          var d3 = $window.d3;

          var rawSvg = elem.find('svg');

          var svg = d3.select(rawSvg[0])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "outline: thin solid gray;");

          var g = svg.append('g');
          var gLayer = g.append("g").attr("id", scope.layerObjects);
          var gLabelLayer = g.append("g").attr("id", scope.layerObjects + "_label");

          var projection = d3.geo.mercator()
            .center(scope.center.split(","))
            .scale(scope.scale)
            .translate([width / 2, height / 2]);

          var path = d3.geo.path().projection(projection);

          d3.json(scope.topojsonPath, function (error, json) {

            var layerFeatues = topojson.feature(json, json.objects[scope.layerObjects]).features;
            var mesh = topojson.mesh(json, json.objects[scope.layerObjects], function(a, b) { return a !== b; });

            // polygons
            gLayer.selectAll("path")
              .data(layerFeatues)
              .enter().append("path")
              .attr("class", "layer1")
              .attr("d", path)
              .attr("fill", scope.bgColor)
              .attr("layer-feature-code", function(d) {
                return findprop(d, scope.layerFeatureCode);
              });

            // border
            gLayer.append("path")
              .datum(mesh)
              .attr("d", path)
              .attr("class", "layer1-boundary");

            // Layer1 labels
            gLabelLayer.selectAll("text")
              .data(layerFeatues)
              .enter()
              .append("text")
              .attr("class", "label")
              .attr("transform", function(d) { 
                return "translate(" + path.centroid(d) + ")"; 
              })
              .attr("dy", "-1em");

            /***** event data *****/
            var endall = function(transition, callback) { 
              var n = 0; 
              transition 
                .each(function() { ++n; }) 
                .each("end", function() { if (!--n) callback.apply(this, arguments); }); 
            }

            var showFeatureNames = function(newValue) {
              var color = d3.scale.linear().domain([1, newValue.length])
                            .interpolate(d3.interpolateHcl)
                            .range(scope.colorRange.split(","));

              var fromFeatureCodes = extractCodes(newValue, "from_code");
              var toFeatureCodes = extractCodes(newValue, "to_code");


              gLabelLayer.selectAll("text")
                .filter(function(d){
                  return (fromFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode)) > -1)
                    || (toFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode)) > -1);
                })
                .text(function(d){
                  var fromIndex = fromFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode));
                  var toIndex = toFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode));
                  if (fromIndex > -1) {
                    return "From_" + (fromIndex + 1) + "_" + findprop(d, scope.layerFeatureName);
                  }
                  else if (toIndex > -1) {
                    return "To_" + (toIndex + 1) + "_" + findprop(d, scope.layerFeatureName);
                  }
                })
                .transition()
                .style("fill-opacity", 1)
                .style("display", "block")
                .style("fill", function(d,i) {
                  d.showname = true;

                  var fromIndex = fromFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode));
                  var toIndex = toFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode));
                  if (fromIndex > -1) {
                    return color(fromIndex + 1);
                  }
                  else if (toIndex > -1) {
                    return color(toIndex + 1);
                  }
                });
            }

            var highlightFeatures = function(newValue) {

              var color = d3.scale.linear().domain([1, newValue.length])
                            .interpolate(d3.interpolateHcl)
                            .range(scope.colorRange.split(","));

              var fromFeatureCodes = extractCodes(newValue, "from_code");
              var toFeatureCodes = extractCodes(newValue, "to_code");

              gLayer.selectAll("path")
                .filter(function(d){
                  return (fromFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode)) > -1)
                    || (toFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode)) > -1);
                })
                .transition()
                .attr("fill", function(d,i) {
                  d.highlight = true;

                  var fromIndex = fromFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode));
                  var toIndex = toFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode));
                  if (fromIndex > -1) {
                    return color(fromIndex + 1);
                  }
                  else if (toIndex > -1) {
                    return color(toIndex + 1);
                  }
                });
            }

            var hideFeatureNames = function() {

              var dfd = $q.defer();

              var highlightData = gLabelLayer.selectAll("text")
                .filter(function(d){
                  return d.hasOwnProperty("showname");
                });

              if (highlightData.size() == 0) {
                dfd.resolve();
              } else {
                highlightData
                  .transition()
                  .style("fill-opacity", 0)
                  .transition()
                  .text(function(d){
                    if (d.hasOwnProperty("showname")) {
                      delete d.showname;
                    }
                    return "";
                  })
                  .attr("style", null)
                  .call(endall, function() {
                    dfd.resolve();
                  });
              }

              return dfd.promise;

            }

            var dehighlightFeatures = function(oldFeatureCodes) {
              
              var dfd = $q.defer();

              var highlightData = gLayer.selectAll("path")
                    .filter(function(d){
                      return d.hasOwnProperty("highlight");
                    });

              if (highlightData.size() == 0) {
                dfd.resolve();
              } else {
                highlightData
                  .transition()
                  .attr("fill", function(d){
                    delete d.highlight;
                    return scope.bgColor;
                  })
                  .call(endall, function() {
                    dfd.resolve();
                  });                
              }

              return dfd.promise;
            }

            var extractCodes = function(routes, key) {
              var featureCodes = [];
              if (routes) {
                
                routes.forEach(function(entry) {
                    featureCodes.push(entry[key]);
                });

                return featureCodes;
              }
              else {
                return featureCodes;
              }
            }

            // rx observeOnScope for data changes and re-render
            observeOnScope(scope, 'data').subscribe(function(change) {
              hideFeatureNames().then(function () {
                  if (change.newValue) {
                    showFeatureNames(change.newValue);  
                  }
                });

              dehighlightFeatures().then(function () {
                  if (change.newValue) {
                    highlightFeatures(change.newValue);  
                  }
                });
    
            }); 
            /***** event data *****/

          });
        }
     };
  });
}() );