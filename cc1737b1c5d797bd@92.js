function _d3(require){return(
require("d3@7")
)}

function _data(){return(
{
  name: "",
  children: [
    {
      name: "Alabama",
      imageURL: "https://www.pngall.com/wp-content/uploads/16/Alabama-State-PNG-File.png",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 }
      ]
    },
    {
      name: "Georgia",
      imageURL: "https://images.vexels.com/media/users/3/328913/isolated/preview/8939875e88e97c37ebfcd7e3f90a9b55-georgia-retro-stroke-usa-states.png",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 10 },
        { name: "Motor Vehicle Records", value: 10 }        
      ]
    },
    {
      name: "Hawaii",
      imageURL: "https://images.vexels.com/media/users/3/328921/isolated/preview/dfbaa632d010fc64bedc2b0f1bc3c3d4-hawaii-retro-stroke-usa-states.png",
      children: [
        { name: "Countywide", value: 50 },
        { name: "Statewide", value: 50 },
        { name: "Professional & Business", value: 10 },
        { name: "Motor Vehicle Records", value: 10 }        
      ]
    }
  ]
}
)}

function _chart(d3,data)
{
  const width = 600;
  const height = 600;

  const root = d3.hierarchy(data)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

  const packLayout = d3.pack()
    .size([width, height])
    .padding(3);

  packLayout(root);

  let focus = root;
  let view;

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("font-family", "franklin-gothic")
    .style("background", "#000000")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const bubblesLayer = svg.append("g");
  const labelLayer = svg.append("g");

  const node = bubblesLayer.selectAll("g")
    .data(root.descendants())
    .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .on("click", function(event, d) {
        if (focus !== d) {
          zoom(d);
          event.stopPropagation();
        }
      });

  node.append("circle")
    .attr("r", d => d.r)
    .attr("fill", d => d.children ? "#ccc" : "#D3D3D3")
    .attr("stroke", "#555")
    .attr("stroke-width", 1);

  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.3em")
    .style("font-size", "10px")
    .text(d => d.children ? d.data.name : d.data.name);

  svg.on("click", () => zoom(root));

  function zoom(d) {
    focus = d;
    const transition = svg.transition()
      .duration(750)
      .tween("zoom", () => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return t => zoomTo(i(t));
      });
  }

function zoomTo(v) {
  view = v;
  const k = width / v[2];

  node.attr("transform", d =>
    `translate(${(d.x - v[0]) * k + width / 2},${(d.y - v[1]) * k + height / 2})`
  );
  node.selectAll("circle").attr("r", d => d.r * k);

    if (focus === root) {
      const imgWidth = 100;
      const imgHeight = 100;
      
    const childImages = labelLayer.selectAll(".child-image")
      .data(root.children, d => d.data.name);

    childImages.enter()
      .append("image")
      .attr("class", "child-image")
      .attr("xlink:href", d => d.data.imageURL)
      .attr("width", imgWidth)
      .attr("height", imgHeight)
      .attr("x", d => (d.x - v[0]) * k + width / 2 - imgWidth / 2)
      .attr("y", d => (d.y - v[1]) * k + height / 2 - imgHeight / 2);

    childImages
      .attr("x", d => (d.x - v[0]) * k + width / 2 - imgWidth / 2 * k)
      .attr("y", d => (d.y - v[1]) * k + height / 2 - imgHeight / 2 * k)
      .attr("width", imgWidth * k)
      .attr("height", imgHeight * k);

    childImages.exit().remove();
  } else {
    labelLayer.selectAll(".child-image").remove();
  }
}
  
  zoomTo([root.x, root.y, root.r * 2]);

  return svg.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("data")).define("data", _data);
  main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
  return main;
}
