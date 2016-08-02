( function () {
  'use strict';


  angular.module('ngD3geo',[])
  .directive('geo', function($parse, $window){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          labelMap: '=',
          jsonPath: '@',
          width: '@',
          height: '@',
          id: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

      

        }
     };
  });
}() );