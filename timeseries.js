const dataset = parse(dataJson);

const container = d3.select("#timeSeriesContainer");

//select
const defaultOption = 'TX.VAL.AGRI.ZS.UN-ho'
// container
//   .append("select")
//   .call((select) =>
//     select
//       .selectAll("option")
//       .data(Object.keys(dataset))
//       .join("option")
//       .attr("value", (d) => d)
//       .property("selected", (d) => d == defaultOption)
//       .text((d) => d)
//   )
//   .on("change", (event) => {
//     chart(container, dataset[event.target.value]["data"]);
//   });

$.getJSON('https://sids-dashboard.github.io/api/data/indicatorData-ho.json', function(dat) {
    dat=parse(dat)[defaultOption]["data"]
    delete dat['recentValues']
    delete dat['recentYears']
    chart(container,dat)})

//
//chart(container, dataset[defaultOption]["data"]);
//
function chart(container, data) {
  const width = 600;
  const height = 400;
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const colorTheme = [
    "#E5243B",
    "#DDA63A",
    "#4C9F38",
    "#C5192D",
    "#FF3A21",
    "#26BDE2",
    "#FCC30B",
    "#A21942",
    "#FD6925",
    "#DD1367",
    "#FD9D24",
    "#8F8B2E",
    "#3F7E44",
    "#0A97D9",
    "#56C02B",
    "#00689D",
    "#19486A",
  ];

  //
  const allData = [].concat(...data.map((d) => d.data));
  const allYear = [...new Set(allData.map((d) => d.year))].sort();

  //
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(allData, (d) => d.value))
    .nice()
    .range([innerHeight, 0]);

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(allData, (d) => d.year))
    .range([0, innerWidth]);

  const color = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.country))
    .range(colorTheme);

  //
  const svg = container
    .selectAll("svg")
    .data(["svg"])
    .join("svg")
    .attr("width", "100%")
    .attr("viewBox", [0, 0, width, height])
    .attr("overflow", "visible");

  //

  const gXAxis = svg
    .selectAll("g.x-axis")
    .data([0])
    .join("g")
    .attr("class", "x-axis")
    .attr(
      "transform",
      `translate(${margin.left},${margin.top + innerHeight})`
    )
    .call(xAxis);

  svg
    .selectAll("g.y-axis")
    .data([0])
    .join("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .call(yAxis);

  const gMark = svg
    .selectAll("g.mark")
    .data([0])
    .join("g")
    .attr("class", "mark")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .call(mark);

  svg.on("mousemove", colHoverHandler);

  function mark(g) {
    g.attr("cursor", "pointer");

    //
    g.selectAll("line.hover-line")
      .data(["line"])
      .join("line")
      .attr("class", "hover-line")
      .attr("stroke", "lightgrey")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", 4)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("visibility", "hidden");

    //
    const path = g.selectAll("path").data(data, (d, i) => i);

    path
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("stroke", (d) => color(d.country))
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("opacity", 1)
      .attr("d", (d) =>
        d3
          .line()
          .x((d) => xScale(d.year))
          .y((d) => yScale(d.value))(d.data)
      );

    path
      .transition()
      .attr("opacity", 1)
      .attr("stroke", (d) => color(d.country))
      .attr("d", (d) =>
        d3
          .line()
          .x((d) => xScale(d.year))
          .y((d) => yScale(d.value))(d.data)
      )
      .on("interrupt cancel", function () {
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke", (d) => color(d.country))
          .attr("d", (d) =>
            d3
              .line()
              .x((d) => xScale(d.year))
              .y((d) => yScale(d.value))(d.data)
          );
      });

    path.exit().remove();

    g.selectAll("path.line").on("mouseover", function (e, ddTarget) {
      d3.select(this).attr("stroke-width", 3).attr("opacity", 1);

      gMark
        .selectAll("text.hover-country-text")
        .attr("fill", color(ddTarget.country))
        .attr("visibility", "visible")
        .text(ddTarget.country);

      gMark
        .selectAll("circle.dot")
        .filter((d) => d.country == ddTarget.country)
        .attr("opacity", 1);

      gMark
        .selectAll("text.dot")
        .filter((d) => d.country == ddTarget.country)
        .attr("visibility", "visible")
        .text((d) => d.value);

      gMark
        .selectAll("path.line")
        .filter((d) => d.country !== ddTarget.country)
        .attr("opacity", 0.1);

      gMark
        .selectAll("circle.dot")
        .filter((d) => d.country !== ddTarget.country)
        .attr("opacity", 0.1);

      gMark
        .selectAll("text.dot")
        .filter((d) => d.country !== ddTarget.country)
        .attr("visibility", "hidden");
      //
      gMark.selectAll("line.hover-line").attr("visibility", "hidden");

      gXAxis.selectAll("text.hover-x-axis").remove();

      gXAxis
        .selectAll("text")
        .attr("fill", "grey")
        .attr("visibility", "visible");
    });

    const dot = g.selectAll("circle.dot").data(allData);

    dot
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("stroke", "none")
      .attr("opacity", 1)
      .attr("fill", (d) => color(d.country))
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 3);

    dot
      .transition()
      .attr("fill", (d) => color(d.country))
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 3)
      .attr("opacity", 1)
      .on("interrupt cancel", function () {
        d3.select(this)
          .attr("opacity", 1)
          .attr("fill", (d) => color(d.country))
          .attr("cx", (d) => xScale(d.year))
          .attr("cy", (d) => yScale(d.value))
          .attr("r", 3);
      });

    dot.exit().remove();

    g.selectAll("circle.dot")
      .on("mouseover", function (e, dd) {
        d3.select(this).attr("r", 6);
        d3.selectAll("text.dot")
          .filter((d) => d.country == dd.country && d.year == dd.year)
          .attr("visibility", "visible")
          .text((d) => d.value + ", " + d.year);

        d3.selectAll("text.dot")
          .filter((d) => !(d.country == dd.country && d.year == dd.year))
          .attr("visibility", "hidden");
      })
      .on("mouseout", function () {
        gMark.selectAll("circle.dot").attr("r", 3);
        gMark.selectAll("text.dot").attr("visibility", "hidden");
      });

    const dotText = g.selectAll("text.dot").data(allData);
    dotText
      .enter()
      .append("text")
      .attr("class", "dot")
      .attr("dominant-baseline", "auto")
      .attr("text-anchor", "start")
      .attr("font-size", 10)
      .attr("fill", (d) => color(d.country))
      .attr("x", (d) => xScale(d.year) + 5)
      .attr("y", (d) => yScale(d.value) - 15)
      .attr("visibility", "hidden")
      .text((d) => d.value + ", " + d.year);

    dotText
      .attr("fill", (d) => color(d.country))
      .attr("x", (d) => xScale(d.year) + 10)
      .attr("y", (d) => yScale(d.value) - 10)
      .attr("visibility", "hidden")
      .text((d) => d.value + ", " + d.year);

    dotText.exit().remove();

    //
    g.selectAll("text.hover-country-text")
      .data(["hover-country-text"])
      .join("text")
      .attr("class", "hover-country-text")
      .attr("dominant-baseline", "auto")
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("font-weight", "bold")
      .attr("x", innerWidth / 2)
      .attr("y", 0)
      .attr("visibility", "hidden");
  }

  function xAxis(g) {
    g.transition().call(d3.axisBottom(xScale).tickFormat((d) => d));
    g.selectAll("text").attr("fill", "grey");
    g.selectAll("line").attr("stroke", "grey");
    g.selectAll(".domain").attr("stroke", "grey");
  }

  function yAxis(g) {
    g.transition().call(d3.axisLeft(yScale));
    g.selectAll("text").attr("fill", "grey");
    g.selectAll("line").attr("stroke", "grey");
    g.selectAll(".domain").attr("stroke", "grey");
  }

  let prevState = undefined;
  function colHoverHandler(event) {
    const nodeTarget = event.target;
    let [x, y] = d3.pointer(event);
    x = x - margin.left;
    y = y - margin.top;
    let state;
    if (nodeTarget.getAttribute("class") == "line") {
      state = "line";
    } else if (
      nodeTarget.getAttribute("class") == "dot" &&
      nodeTarget.tagName == "circle"
    ) {
      state = "circle";
    } else if (0 < x && x < innerWidth && 0 <= y && y <= innerHeight) {
      const goal = Math.round(xScale.invert(x));
      const year = allYear.find((y) => y >= goal);
      state = "area" + year;
      if (state !== prevState && prevState !== undefined)
        colHighlight(year);
    } else {
      state = "default";
      if (state !== prevState) recover();
    }

    prevState = state;
  }
  function colHighlight(year) {
    //
    gMark
      .selectAll("line.hover-line")
      .attr("visibility", "visible")
      .attr("x1", xScale(year))
      .attr("x2", xScale(year));

    //
    gMark
      .selectAll("circle.dot")
      .filter((d) => d.year == year)
      .attr("opacity", 1);

    gMark
      .selectAll("text.dot")
      .filter((d) => d.year == year)
      .attr("visibility", "visible")
      .text((d) => d.value);

    gMark
      .selectAll("circle.dot")
      .filter((d) => d.year !== year)
      .attr("opacity", 0);

    gMark
      .selectAll("text.dot")
      .filter((d) => d.year !== year)
      .attr("visibility", "hidden");

    gMark.selectAll("path.line").attr("stroke-width", 2).attr("opacity", 1);

    //

    gXAxis
      .selectAll("text")
      .attr("visibility", "visible")
      .filter((d) => d == year)
      .attr("visibility", "hidden");

    gXAxis.selectAll("g.tick").selectAll("text").attr("fill", "lightgrey");

    gXAxis
      .selectAll("text.hover-x-axis")
      .data(["hover-x-axis"], (d) => d)
      .join("text")
      .attr("class", "hover-x-axis")
      .attr("dominant-baseline", "hanging")
      .attr("text-anchor", "middle")
      .attr("fill", "grey")
      .attr("font-size", 11)
      .attr("x", xScale(year))
      .attr("y", 7)
      .text(year);

    gMark.selectAll("text.hover-country-text").attr("visibility", "hidden");
  }
  function recover() {
    gMark.selectAll("line.hover-line").attr("visibility", "hidden");
    gMark.selectAll("circle").attr("opacity", 1);
    gMark.selectAll("text.dot").attr("visibility", "hidden");
    gMark.selectAll("text.hover-country-text").attr("visibility", "hidden");

    gXAxis.selectAll("text.hover-x-axis").remove();
    gXAxis
      .selectAll("text")
      .attr("fill", "grey")
      .attr("visibility", "visible");
  }
}

function parse(raw) {
  const dataset = raw;

  Object.keys(dataset).forEach((key) => {
    dataset[key]["data"] = processData(dataset[key]["data"]);
  });

  return dataset;

  function processData(rawData) {
    const data = [];

    Object.keys(rawData).forEach((year) => {
      Object.keys(rawData[year]).forEach((country) => {
        const value = rawData[year][country];
        if (isNumber(year)) data.push({ country, year, value });
      });
    });

    return d3
      .rollups(
        data,
        (v) => ({
          country: v[0].country,
          data: v.map((e) => ({
            country: v[0].country,
            year: e.year * 1,
            value: e.value * 1,
          })),
        }),
        (d) => d.country
      )
      .map((d) => d[1]);
  }

  function isNumber(n) {
    return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
  }
}