



var startTransition = function() {

  var n = 1000,
      duration = 550;

  var genX = d3.random.normal();
  var genY = d3.random.normal();

  function dot() {
      var d = {
          x: genX(),
          y: genY()
      };
      return d;   
  }
          
  var w = 400,
      h = 300,
      x = d3.scale.linear().range([0,w/8]),
      y = d3.scale.linear().range([0,h/8]);

  var svg = d3.select('body').append('svg')
      .attr('width', w)
      .attr('height', h * 2);

  var styleCircle = svg.append('g')
      .attr('transform', 'translate(' + (w/2) + ',' + (h/2)+ ')')
    .selectAll('circle')
      .data(d3.range(n).map(dot));
  
  styleCircle.enter().append('circle')
      .style('opacity', 0)
      .attr('cx', function(d) { return x(d.x); })
      .attr('cy', function(d) { return y(d.y); })
      .attr('r', 6);

  styleCircle.transition()
      .delay(function(d,i) { return i * 10; })
      .duration(duration)
      .style('opacity', 1)
  	.transition()
  		.delay(function(d,i) { return i * 10 + duration + 200; })
      .style('opacity', 0)
      .remove;
}