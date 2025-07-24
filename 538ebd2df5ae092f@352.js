function _chart(pack,data,d3,width,height)
{
  const root = pack(data);
  let focus = root;
  let view;

  let values = data.children.map(item => item.value2);  
  const minMax = d3.extent(values);

  let scaleTitleSize = d3.scaleLinear(minMax, [17, 13]);

  const legend = "BACKGROUND INVESTIGATIONS";
  const legend2 = "Click within or outside the circles (not the text labels) to zoom in and out";
  const legend3 = "The final levels contain live links (white circles) to resource sites - click the circle with discretion!"; 

  const svg = d3.create("svg")
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .style("display", "block")
      .style("margin", "0 -14px")
      .style("background", "black")
      .style("cursor", "pointer")
      .on("click", (event) => zoom(event, root));

  const labelLayer = svg.append("g");

    svg.append("text")
      .style("font", "60px 'Roboto', sans-serif")
      .style("font-style", "italic")
      .style("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("x", -0)
      .attr("y", -550)
      .text(legend)
      .attr("fill", "white")
  
    svg.append("text")
      .style("font", "12px 'Roboto', sans-serif")
      .style("font-style", "italic")
      .style("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("x", -463)
      .attr("y", -535)
      .text(legend2)
      .attr("fill", "white")
  
    svg.append("text")
      .style("font", "12px 'Roboto', sans-serif")
      .style("font-style", "italic")
      .style("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("x", -463)
      .attr("y", -520)
      .text(legend3)
      .attr("fill", "white")

  root.descendants().forEach(d => {
    if (d.parent && d.parent.children && d.parent.children.length === 1)
      {d.r = d.r * 0.50;}});
  
  var defs = svg.append("defs");

  var gradient = defs.append("linearGradient")
   .attr("id", "svgGradient")
   .attr("x1", "0%")
   .attr("x2", "100%")
   .attr("y1", "0%")
   .attr("y2", "100%");

  gradient.append("stop")
   .attr('class', 'start')
   .attr("offset", "0%")
   .attr("stop-color", "#dd2826")
   .attr("stop-opacity", 0.33);

  gradient.append("stop")
   .attr('class', 'end')
   .attr("offset", "100%")
   .attr("stop-color", "#dd2826")
   .attr("stop-opacity", 0.33);

  const layerColors = ["crimson", "darkgrey", "grey", "lightgrey", "white"];
  const node = svg.append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
      .attr("fill", d => layerColors[d.depth])
      .style("fill-opacity", d => d.parent === root ? 0.5: 1 )
      .attr("pointer-events", d => !d.children ? "none" : null)
      .on("mouseover", function() { d3.select(this)
        .attr("stroke", "#000")
        .attr("stroke-width", "2"); })
      .on("mouseout", function() { d3.select(this).attr("stroke", null); })
      .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

  const group = svg.append("g")
    .selectAll("g")
    .data(root.descendants())
    .join("g");

  const label = group.append("a")
      .style("font-family", "'Roboto', sans-serif")
      .style("line-height", d => scaleTitleSize(d.data.value2) + "px")
      .style("font-size", d => scaleTitleSize(d.data.value2) + "px")
      .style("font-weight", "900")
      .style("fill", "black")
      .attr("pointer-events", "all")
      .attr("text-anchor", "middle")
      .attr("transform", d => {
        if (!d.children) {
          return "translate(" + 3 + ", "+ 25 +")"
        } else {
          return "translate(" + 0 + ", "+ 0 +")" }
        })
    .attr("target", "_blank")
    .attr("xlink:href", d => d.data.url)
    .append("text")
      .style("fill-opacity", d => d.parent === root ? 1 : 0)
      .style("display", d => d.parent === root ? "inline" : "none")
      .text(d => d.data.name)
      .attr("fill", d => {
        if (!d.children) {
          return "slateblue";
        } else {
          return "black" }
      })
      .attr("dominant-baseline", "central")
      .html(function (d) {
        if (!d.children) {
          var dy = (d.parent === root) ? '-0.9em' : '-0.9em';
          var dx = '0.0em';
          return d.data.name.split(' ').reverse().map(n => "<tspan x="+ dx +" dy="+dy +">" + n + ' ' + "</tspan>").join('\n\n');
        } else {
          return d.data.name  
      }});

zoomTo([root.x, root.y, root.r * 2]);

function zoomTo(v) {
  const k = width / v[2];
  view = v;

  label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
  node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
  node.attr("r", d => d.r * k);

  labelLayer.selectAll(".child-image").remove();

  if (focus === root) {
    const imgWidth = 75;
    const imgHeight = 75;

    const childImages = labelLayer.selectAll(".child-image")
      .data(root.children.filter(d => d.data.imageURL), d => d.data.name);

    childImages.enter()
      .append("image")
      .attr("class", "child-image")
      .attr("xlink:href", d => d.data.imageURL)
      .attr("width", imgWidth * k)
      .attr("height", imgHeight * k)
      .attr("x", d => (d.x - v[0]) * k - (imgWidth * k) / 2)
      .attr("y", d => (d.y - v[1]) * k - (imgHeight * k) / 2);
  }

  labelLayer.raise();
  
}

function zoom(event, d) {
  const focus0 = focus;
  focus = d;

  const transition = svg.transition()
    .duration(event.altKey ? 7500 : 750)
    .tween("zoom", d => {
      const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
      return t => zoomTo(i(t));
    });

  label
    .filter(function(d) {
      return d.parent === focus || this.style.display === "inline";
    })
    .transition(transition)
    .style("fill-opacity", d => d.parent === focus ? 1 : 0)
    .on("start", function(d) {
      if (d.parent === focus) this.style.display = "inline";
    })
    .on("end", function(d) {
      if (d.parent !== focus) this.style.display = "none";
    });
}

return svg.node();

}


function _data(){return(
{
  name: "Background Investigations",
  children: [

{ name: "Alabama",
  value: 100,
  imageURL: "https://images.vexels.com/media/users/3/328885/isolated/preview/4bb8b2741767708c2a70e4b7b8b18e95-alabama-retro-sunset-usa-states.png",
      children: [
        { name: "Countywide", value: 100,
          children: [
            { name: "Mobile County", value: 100,
                children: [
                { name: "City of Mobile Municipal Court (Traffic/Criminal)",
                  value: 100,
                  url: "https://www.municipalrecordsearch.com/mobileal/Cases" }]},
            { name: "Montgomery County", value: 100,
                children: [
                { name: "City of Mobile Municipal Court (Traffic/Criminal)",
                  value: 100,
                  url: "https://www.municipalrecordsearch.com/mobileal/Cases", }]}]},
        { name: "Statewide", value: 100 },
        { name: "Professional & Business", value: 75 },
        { name: "Motor Vehicle Records", value: 75 }]},
   
{ name: "Alaska",
  value: 100,
  imageURL: "https://www.svgheart.com/wp-content/uploads/2024/09/ak-alaska_413-429-min.png",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "Arizona",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "Arkansas",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "California",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "https://www.zillowstatic.com/bedrock/app/uploads/sites/42/GettyImages-621716422-Colorado-1065be.jpg",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "Connecticut",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "Delaware",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "Florida",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "Georgia",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "Hawaii",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "Idaho",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "https://www.iltreasurervault.com/uploads/showcase/2024-10-08-190440.538990IL-Based-2.png",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

{ name: "",
  value: 100,
  imageURL: "",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 50 },
        { name: "Motor Vehicle Records", value: 50 }
                ]
},

    






    
            ]
}
)}

function _pack(d3,width,height){return(
data => d3.pack()
    .size([width, height])
    .padding(3)
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))
)}

function _width(){return(
window.innerWidth
)}

function _height(){return(
window.innerHeight
)}

function _format(d3){return(
d3.format(",d")
)}

function _color(d3){return(
d3.scaleSequential([8, 0], d3.interpolateMagma)
)}

function _d3(require){return(
require("d3@6")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer("chart")).define("chart", ["pack","data","d3","width","height"], _chart);
  main.variable(observer("data")).define("data", _data);
  main.variable(observer("pack")).define("pack", ["d3","width","height"], _pack);
  main.variable(observer("width")).define("width", _width);
  main.variable(observer("height")).define("height", _height);
  main.variable(observer("format")).define("format", ["d3"], _format);
  main.variable(observer("color")).define("color", ["d3"], _color);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  return main;
}
