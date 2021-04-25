<template>
  <div ref="resizeRef">
    <svg ref="svgRef">
      <g class="x-axis" />
      <g class="y-axis" />
    </svg>
  </div>
</template>

<script>
import { onMounted, ref, watchEffect } from "vue";
import * as d3 from "d3";
import useResizeObserver from "@/resize";
// thanks muratkemaldar: https://github.com/muratkemaldar/using-vue3-with-d3

export default {
  name: "Chart",
  props: ["data", "start", "end"],
  setup(props) {
    // create ref to pass to D3 for DOM manipulation
    const svgRef = ref(null);
    // create another ref to observe resizing, since observing SVGs doesn't work!
    const { resizeRef, resizeState } = useResizeObserver();
    // var t = d3.transition()
    //     .duration(750)
    //     .ease(d3.easeLinear);

    onMounted(() => {
      // pass ref with DOM element to D3, when mounted (DOM available)
      const svg = d3.select(svgRef.value);
      // whenever any dependencies (like data, resizeState) change, call this!
      watchEffect(() => {
        if (props.data.length) {
          svg.style("display", "block");
          const { width, height } = resizeState.dimensions;
          // scales: map index / data values to pixel values on x-axis / y-axis
          const xScale = d3.scaleLinear()
            .domain([0, props.data.length - 1])
            .range([0, width]);
          const yScale = d3.scaleLinear()
            .domain([d3.min(props.data), d3.max(props.data)])
            .range([height, 0]);
          // line generator: D3 method to transform an array of values to data points ("d") for a path element
          const lineZero  =  d3.line()
            .curve(d3.curveBasis)
            .x((value, index) => xScale(index))
            .y(height);
            // for stroke-dash interpolation: https://observablehq.com/@jurestabuc/animated-line-chart
          const lineGen = d3.line()
            .curve(d3.curveBasis)
            .x((value, index) => xScale(index))
            .y((value) => yScale(value));
          // render path element with D3's General Update Pattern
          svg
            .selectAll(".line")
            .data([props.data]) // pass entire data array
            .join("path")
            .attr("class", "line")
            .attr("stroke", "green")
            .attr("d", lineZero)
            .transition()
            .duration(1000) // duration of the animation
            .delay(200)
            .attr("d", lineGen);
          // render axes with help of scales
          const xAxis = d3.axisBottom(xScale).tickFormat((d,i) => {
            // console.log(d, i);
            return d + props.start
          });

          svg
            .select(".x-axis")
            .style("transform", `translateY(${height}px)`) // position on the bottom
            .call(xAxis);
          const yAxis = d3.axisLeft(yScale);
          svg.select(".y-axis").call(yAxis);
        } else {
          console.log("chart is empty");
          svg.style("display", "none");
        }
      });
    });
    return { svgRef, resizeRef };
  },
};
</script>
