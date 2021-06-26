<template>

  <div ref="resizeRef">
    <svg ref="svgRef" @click="chartClicked">
      <g class="x-axis" />
      <g class="y-axis" />
  </svg>
  </div>

</template>

<script>

  import { onMounted, ref, watchEffect, onBeforeMount, watch } from 'vue';
  import * as d3 from 'd3';
  import useResizeObserver from '@/resize';
  import store from '../store';
  // thanks muratkemaldar: https://github.com/muratkemaldar/using-vue3-with-d3

  export default {
    name: 'Chart',
    props: ['tokens'],
    setup(props) {
      console.log('chart setup');
      // create ref to pass to D3 for DOM manipulation
      const svgRef = ref(null);
      // create another ref to observe resizing, since observing SVGs doesn't work!
      const { resizeRef, resizeState } = useResizeObserver();
      let svgInitiated = false;
      let svg, path, width, height;

      const xScale = d3.scaleLinear();
      const yScale = d3.scaleLinear();

      const line = d3
        .line()
        // .defined(d => !isNaN(d))
        .curve(d3.curveBasis);

      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      const updateChart = async () => {
        if (!svgInitiated) {
          svgInitiated = true;
          svg = d3.select(svgRef.value);

          svg
            .append('text')
            // .attr("transform", "rotate(-90)")
            .attr('x', width - 6)
            .attr('y', 6)
            .attr('dy', '1em')
            .style('text-anchor', 'end')
            .style('fill', 'silver')
            .text('Ruscorpora.ru');

          path = svg
            .append('path')
            // .datum(freqs.ipms)
            .attr('class', 'line');
        }

        console.log('tokens', props.tokens, typeof props.tokens);

        const tkn  = typeof props.tokens == 'Object' ? props.tokens[0] :  props.tokens;
        await store.getFreq(tkn);
        const freqs = store.state.freqs[tkn];

        xScale.domain([0, freqs.ipms.length - 1]).range([0, width]);
        yScale.domain([0, freqs.ipmMax]).range([height, 0]);

        xAxis.scale(xScale).tickFormat(d => d + freqs.yearFirst);
        yAxis.scale(yScale).ticks(10, freqs.ipmMax > 1 ? 'd' : '.2f');

        svg
          .select('.x-axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

        svg.select('.y-axis').call(yAxis);

        line.x((value, index) => xScale(index)).y(value => yScale(value));

        path
          //d3.select('.line')
          .attr('fill', 'none')
          .attr('stroke-width', 2)
          .attr('stroke', '#42b983')
          .attr('d', line(freqs.ipms));

        const totalLength = path.node().getTotalLength();

        path
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(2000)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0);
      };

      onMounted(() => {
        watch(resizeState, (newValues, preValues) => {
          console.log('chart resized');
          ({ width, height } = resizeState.dimensions);
          updateChart();
        });

        watch(
          () => props.tokens,
          (newVal, preVal) => {
            if (props.tokens?.length) {
              console.log('data updated', "new:", newVal,  "pre", preVal);
              updateChart();
            }
          }
        );
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
