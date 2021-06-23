<template>

  <div ref="resizeRef">
    <svg ref="svgRef" @click="chartClicked">
              <g class="x-axis" />
              <g class="y-axis" />
            </svg>
  </div>

</template>

<script>

  import { onMounted, ref, watchEffect } from 'vue';
  import * as d3 from 'd3';
  import useResizeObserver from '@/resize';
  import store from '../store';
  // thanks muratkemaldar: https://github.com/muratkemaldar/using-vue3-with-d3

  export default {
    name: 'Chart',
    props: ['data', 'title'],
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
        svg.style('display', 'none');
        // whenever any dependencies (like data, resizeState) change, call this!
        watchEffect(() => {
          if (props.data?.length) {
            // console.log("data", props.data);
            const end = Number(props.data.slice(-1)[0][0]);
            const start = Number(props.data[0][0]);
            // const freqs = props.data.map((x) => x[1]);
            const freqs  = Array(end - start).fill(0);
            props.data.forEach(item => freqs[item[0]-start]=item[1]);
            // console.log("freqs", freqs);

            svg.style('display', 'block');
            const { width, height } = resizeState.dimensions;
            // scales: map index / data values to pixel values on x-axis / y-axis
            const xScale = d3
              .scaleLinear()
              .domain([0, freqs.length - 1])
              .range([0, width]);
            const yScale = d3
              .scaleLinear()
              // .domain([d3.min(freqs), d3.max(freqs)])
              .domain([0, d3.max(freqs)])
              .range([height, 0]);
            // line generator: D3 method to transform an array of values to data points ("d") for a path element
            // const lineZero  =  d3.line()
            //   .curve(d3.curveBasis)
            //   .x((value, index) => xScale(index))
            //   .y(height);
            // for stroke-dash interpolation: https://observablehq.com/@jurestabuc/animated-line-chart
            const line = d3
              .line()
              // .defined(d => !isNaN(d))
              .curve(d3.curveBasis)
              .x((value, index) => xScale(index))
              .y(value => yScale(value));
            // render path element with D3's General Update Pattern

            var path = svg
              //.append("path")
              .selectAll('.line')
              .data([freqs]) // pass entire data array
              .join('path')
              // .datum(freqs)
              .attr('class', 'line')
              .style('fill', 'none')
              .style('stroke', 'green')
              // .style('stroke', (d, i) => {
              //   // console.log(d, i);
              //   return 'green'
              // })
              .attr('d', line);

            // Variable to Hold Total Length
            var totalLength = path.node().getTotalLength();

            // Set Properties of Dash Array and Dash Offset and initiate Transition
            path
              .attr('stroke-dasharray', totalLength + ' ' + totalLength)
              .attr('stroke-dashoffset', totalLength)
              .transition() // Call Transition Method
              .duration(2000) // Set Duration timing (ms)
              .ease(d3.easeLinear) // Set Easing option
              .attr('stroke-dashoffset', 0); // Set final value of dash-offset for transition

            // svg
            //   .selectAll(".line")
            //   .data([freqs]) // pass entire data array
            //   .join("path")
            //   .attr("class", "line")
            //   .attr("stroke", "green")
            //   .attr("d", lineZero)
            //   .transition()
            //   .duration(1000) // duration of the animation
            //   .delay(200)
            //   .attr("d", lineGen);
            // render axes with help of scales
            const xAxis = d3.axisBottom(xScale).tickFormat((d, i) => {
              // console.log(d, i);
              return d + start;
            });

            svg
              .select('.x-axis')
              //.style('transform', `translateY(${height}px)`) // position on the bottom
              .attr('transform', 'translate(0,' + height + ')')
              .call(xAxis);

            const yAxis = d3.axisLeft(yScale).ticks(10, 'd');
            svg
              .select('.y-axis')
              // .style("font", "14px times")
              // .style("fill", "red")
              .call(yAxis)
              .append('text')
              // .attr("transform", "rotate(-90)")

              .attr('x', width - 6)
              .attr('y', 6)
              .attr('dy', '1em')
              .style('text-anchor', 'end')
              // .style('fill', 'gray')
              .style('fill', 'silver')
              // .style('font-family', 'Fira Sans Extra Condensed')
              .text('Ruscorpora.ru');
          } else {
            // console.log("chart is empty");
            // svg.style('display', 'none');
          }
        });
      });

      const serializeSVG = svg => {
        const xmlns = 'http://www.w3.org/2000/xmlns/';
        const xlinkns = 'http://www.w3.org/1999/xlink';
        const svgns = 'http://www.w3.org/2000/svg';
        return function serialize() {
          // console.log("svg source", svg);
          svg = svg.cloneNode(true);
          const fragment = window.location.href + '#';
          const walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
          while (walker.nextNode()) {
            for (const attr of walker.currentNode.attributes) {
              if (attr.value.includes(fragment)) {
                attr.value = attr.value.replace(fragment, '#');
              }
            }
          }
          svg.setAttributeNS(xmlns, 'xmlns', svgns);
          svg.setAttributeNS(xmlns, 'xmlns:xlink', xlinkns);
          const { width, height } = resizeState.dimensions;
          svg.setAttribute('viewBox', `-50 -50 ${width + 100} ${height + 100}`);
          const serializer = new window.XMLSerializer();
          const string = serializer.serializeToString(svg);
          return new Blob([string], { type: 'image/svg+xml' });
        };
      };

      const renderImage = svg => {
        let resolve, reject;
        const promise = new Promise((y, n) => ((resolve = y), (reject = n)));
        const image = new Image();
        image.onerror = reject;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const link = document.createElement('a');
        const filename = props.title + '-' + store.getFormattedTime();

        image.onload = () => {
          const rect = svg.getBoundingClientRect();
          canvas.width = rect.width * 4;
          canvas.height = rect.height * 4;
          context.fillStyle = '#F1F1EF';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, rect.width * 4, rect.height * 4);

          context.canvas.toBlob(function(blob) {
            var url = URL.createObjectURL(blob);
            link.download = filename + '.png';
            link.href = url;
            // console.log('link', link.href);
            link.click();
            URL.revokeObjectURL(url);
          });
          // console.log('on load');
        };

        const serializedSVG = serializeSVG(svg);
        // console.log("svg:serialized", serializedSVG());
        const url = URL.createObjectURL(serializedSVG());
        link.download = filename + '.svg';
        image.src = url;
        link.href = url;
        // console.log('link', image.src);
        link.click();
        // URL.revokeObjectURL(url);
        return promise;
      };

      const chartClicked = async () => {
        await renderImage(svgRef.value);
      };
      return { svgRef, resizeRef, chartClicked };
    },
  };

</script>

<style>

  path.line {
    stroke: green;
  }
  svg {
    /* important for responsiveness */
    display: block;
    fill: none;
    stroke: none;
    width: 100%;
    height: 100%;
    overflow: visible;
    background: #eee;
  }

  .y-axis text {
    fill: gray;
    font: 0.75rem 'Fira Sans Extra Condensed', sans-serif !important;
  }

  .x-axis text {
    fill: gray;
    font: 0.75rem 'Fira Sans Extra Condensed', sans-serif !important;
  }

</style>
