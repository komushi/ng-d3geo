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

          /* Initialize tooltip */
          var tip = d3.tip().attr('class', 'd3-tip').offset([-30, 0])
            .html(function(text) { 
              return "<span style='color:red'><strong>" + text + "</strong></span>";
            });

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

          var g = svg.append('g').call(tip);
          var gLayer2 = g.append("g").attr("id", scope.layer2Objects);
          var gLayer1 = g.append("g").attr("id", scope.layer1Objects);

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

            // Layer1 polygons
            gLayer1.selectAll("path")
              .data(layer1Featues)
              .enter().append("path")
              .attr("class", "layer1")
              .attr("d", path)
              .attr("fill", function(d,i) { 
                return color(i);
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
            gLayer1.selectAll("text")
              .data(layer1Featues)
              .enter().append("text")
              .attr("class", "layer1-label")
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
            gLayer1.selectAll('text')
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
            gLayer1.selectAll('text')
              .style("display", "block");

            scope.onStopEvents();
          };
          /***** click to zoom *****/

          /***** d3-tip *****/
          var mouseoverLayer2 = function(p) {
            tip.show(findprop(p, scope.layer1FeatureName) + ' ' + findprop(p, scope.layer2FeatureName));
          }
          
          var mouseoutLayer2 = function () {
            tip.hide();
          }
          /***** d3-tip *****/

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
  .directive('fixedScaleMap', function($parse, $window, observeOnScope){
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


            if (scope.featureNameStyle == 'events') {
              var color = d3.scale.linear().domain([1,layerFeatues.length])
                            .interpolate(d3.interpolateHcl)
                            .range(scope.colorRange.split(","));

              // polygons
              g.selectAll("path")
                .data(layerFeatues)
                .enter().append("path")
                .attr("class", "layer1")
                .attr("d", path)
                .attr("fill", scope.bgColor)
                .attr("layer-feature-code", function(d) {
                  return findprop(d, scope.layerFeatureCode);
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
                .attr("class", "layer1-label")
                .style("fill-opacity", 0)
                .style("display", "none")
                .attr("transform", function(d) { 
                  // return "translate(" + path.centroid(d) + ")"; 
                  return "translate(" + [path.centroid(d)[0], path.centroid(d)[1] - 20] + ")"; 
                })
                .attr("dy", ".35em")
                .text(function(d) { 
                  return findprop(d, scope.layerFeatureName); 
                })
                .attr("layer-feature-code", function(d) { 
                  return findprop(d, scope.layerFeatureCode);
                });

              /***** event data *****/
              var endall = function(transition, callback) { 
                var n = 0; 
                transition 
                  .each(function() { ++n; }) 
                  .each("end", function() { if (!--n) callback.apply(this, arguments); }); 
              }

              var duration = 50;

              var showFeatureNames = function(newFeatureCodes) {
                g.selectAll("text")
                  .filter(function(d){
                    return newFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode)) > -1;
                  })
                  .transition()
                  .duration(duration)
                  .style("fill-opacity", 1)
                  .style("display", "block");
              }

              var hideFeatureNames = function(oldFeatureCodes, newFeatureCodes) {
                g.selectAll("text")
                  .filter(function(d){
                    return oldFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode)) > -1;
                  })
                  .transition()
                  // .duration(duration)
                  .style("fill-opacity", 0)
                  .transition()
                  .style("display", "none")
                  .call(endall, function() {
                      if (newFeatureCodes) {
                        showFeatureNames(newFeatureCodes);    
                      }
                  });
              }

              var restoreFeatures = function(oldFeatureCodes, newFeatureCodes) {
                g.selectAll("path")
                  .filter(function(d){
                    return oldFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode)) > -1;
                  })
                  .transition()
                  // .duration(duration)
                  .attr("fill", scope.bgColor)
                  .call(endall, function() {
                      if (newFeatureCodes) {
                        highlightFeatures(newFeatureCodes);    
                      }
                  });
              }

              var highlightFeatures = function(newFeatureCodes) {
                var color = d3.scale.linear().domain([1, newFeatureCodes.length])
                              .interpolate(d3.interpolateHcl)
                              .range(scope.colorRange.split(","));

                g.selectAll("path")
                  .filter(function(d){
                    return newFeatureCodes.indexOf(findprop(d, scope.layerFeatureCode)) > -1;
                  })
                  .transition()
                  .duration(duration)
                  // .attr("fill", "red");
                  .attr("fill", function(d,i) { 
                    return color(i);
                  });
              }

              // rx observeOnScope for data changes and re-render
              observeOnScope(scope, 'data').subscribe(function(change) {
                if (!change.oldValue) {
                  if (change.newValue) {
                    showFeatureNames(change.newValue);
                    highlightFeatures(change.newValue);
                  }
                } else {
                  if (change.newValue) {
                    hideFeatureNames(change.oldValue, change.newValue);
                    restoreFeatures(change.oldValue, change.newValue);
                  }
                }
              }); 
              /***** event data *****/

            } else if (scope.featureNameStyle == 'static') {
              var color = d3.scale.linear().domain([1,layerFeatues.length])
                            .interpolate(d3.interpolateHcl)
                            .range(scope.colorRange.split(","));

              // var color = d3.scale.category10();

              // polygons
              g.selectAll("path")
                .data(layerFeatues)
                .enter().append("path")
                .attr("class", "layer1")
                .attr("d", path)
                .attr("fill", function(d,i) { 
                  return color(i);
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
                .attr("class", "layer1-label")
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
                  return color(i);
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

            if (scope.featureNameStyle == 'tip') {
              /***** d3-tip *****/
              // Initialize tooltip 
              var tip = d3.tip().attr('class', 'd3-tip').offset([0, 0])
                .html(function(text) { 
                  return "<span style='color:red'><strong>" + text + "</strong></span>";
                });          

              if (scope.featureNameStyle == 'tip') {
                g.call(tip); 
              }

              var mouseover = function(p) {
                tip.show(findprop(p, scope.layerFeatureName));
              }
              
              var mouseout = function (p) {
                tip.hide();
              }
              /***** d3-tip *****/

              // polygons
              g.selectAll("path")
                .data(layerFeatues)
                .enter().append("path")
                .attr("class", "layer1")
                .attr("d", path)
                .attr("fill", function(d,i) { 
                  return color(i);
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

            } else if (scope.featureNameStyle == 'fading') {

              var mouseover = function(p) {
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
                  return color(i);
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
                .attr("class", "layer1-label")
                .style("fill-opacity", 0)
                .style("display", "none")
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
            } else if (scope.featureNameStyle == 'static') {
              // polygons
              g.selectAll("path")
                .data(layerFeatues)
                .enter().append("path")
                .attr("class", "layer1")
                .attr("d", path)
                .attr("fill", function(d,i) { 
                  return color(i);
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
                .attr("class", "layer1-label")
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
                  return color(i);
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
            g.selectAll("text").attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; });
          }

          svg.call(d3.behavior.zoom().on("zoom", redraw));
          /***** mouse zoom & pan *****/
        }
     };
  });
}() );