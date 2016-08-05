# Angular Directives for d3 geo

![Geo](https://raw.githubusercontent.com/komushi/ng-d3geo/master/image/image1.png)

![Geo](https://raw.githubusercontent.com/komushi/ng-d3geo/master/image/image2.png)

----------
Local Demo
-------------
###Download & Installation
```
git clone https://github.com/komushi/ng-d3geo.git
cd ng-d3geo/examples
live-server
```
###Access the local server
http://localhost:8080

----------
Quick Start
-------------
### Install via Bower
```bash
bower install --save ng-d3geo
```

### Usage
```
<!DOCTYPE html>
<html>

<head>
  <title>matrix</title>
    <script src="https://code.angularjs.org/1.5.7/angular.min.js"></script>
    <script data-require="d3@*" data-semver="3.5.5" src="//cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.js"></script>
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/d3-tip/0.6.7/d3-tip.min.js"></script>
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/topojson/1.6.20/topojson.min.js"></script>
    <script type="text/javascript" src="https://rawgit.com/komushi/ng-d3geo/master/src/ng-d3geo.js"></script> 
    <link rel="stylesheet" href="https://rawgit.com/komushi/ng-d3geo/master/src/css/ng-d3geo.css" /> 
</head>

<body ng-app="d3geoApp">

<script>
var app = angular.module("d3geoApp", ['ngD3geo']); 
app.controller("2layerMapCtrl", ['$scope', '$http', '$interval', function($scope, $http, $interval) {
}]);
</script>

<div ng-controller="2layerMapCtrl">
  <div style="width:1500px; height:800px;">
    <h2>2-Layer Map Tokyo</h2>
    <div 2layer-map
      id="01"
      topojson-path="data/tokyo_23_blocks_districts_final.json"
      width="800"
      height="800"
      layer1-color-range="#0d47a1,#e3f2fd"
      center="139.752268, 35.677043"
      scale="110000"
      layer1-objects="districts"
      layer2-objects="blocks"
      layer1-feature-name="properties.district"
      layer1-feature-code="properties.district_code"
      layer2-feature-name="properties.block"
      layer2-feature-code="properties.block_code"
      >
    </div>
  </div>

  <br/>
  <br/>
  <div style="width:1500px; height:800px;">
    <h2>Zoom & Map US</h2>
    <div zoom-pan-map
      id="04"
      topojson-path="data/us_counties_states_final.json"
      width="1200"
      height="600"
      color-range="#0d47a1,#e3f2fd"
      center="-99.736816, 38.818207"
      scale="1000"
      layer-objects="us_states"
      layer-feature-name="properties.state_code"
      layer-feature-code="properties.state_code"
      feature-name-style="tip"
      >
    </div>
  </div>
</div>


</body>
</html>
```