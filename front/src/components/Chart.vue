<template>

  <div ref="resizeRef">
    <svg ref="svgRef" @click="chartClicked"></svg>
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
    props: ['tokens', 'corpus'],
    setup(props) {
      console.log('chart setup');
      // create ref to pass to D3 for DOM manipulation
      const svgRef = ref(null);
      // create another ref to observe resizing, since observing SVGs doesn't work!
      const { resizeRef, resizeState } = useResizeObserver();
      let svgInitiated = false;
      let svg, path, dots, width, height, tkn;
      const margin = {top: 10, right: 10, bottom: 50, left: 25};
      const ruRU = {
        "decimal": ",",
        "thousands": " ",
        "grouping": [3],
        "currency": ["", " руб."],
        "dateTime": "%A, %e %B %Y г. %X",
        "date": "%d.%m.%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
        "shortDays": ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
        "months": ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
        "shortMonths": ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
      };

      d3.formatDefaultLocale(ruRU);

      const xScale = d3.scaleLinear();
      const yScale = d3.scaleLinear();

      const line = d3.line().defined(d => !isNaN(d));
      // .curve(d3.curveBasis)
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      const updateChart = async () => {
        if (!svgInitiated) {
          svgInitiated = true;
          svg = d3.select(svgRef.value);
          svg = svg.append("g");
          // svg.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          svg.attr("transform", "translate(" + margin.left + "," + 0 + ")");

          svg.append("g").attr("class", "x-axis")
          svg.append("g").attr("class", "y-axis")

          svg
            .append('text')
            // .attr("transform", "rotate(-90)")
            .attr('x', width - 6)
            .attr('y', 14)
            .style('text-anchor', 'end')
            .style('fill', 'silver')
            .text('ruscorpora.ru');

          path = svg
            .append('path')
            // .datum(freqs.ipms)
            .attr('class', 'line');
        }

        console.log('tokens', props.tokens, typeof props.tokens);

        tkn = typeof props.tokens == 'Object' ? props.tokens[0] : props.tokens;
        await store.getFreq(tkn, props.corpus);
        const freqs = store.state.freqs[tkn+props.corpus];
        console.log(tkn, props.corpus, freqs);

        xScale.domain([0, freqs.ipms.length]).range([0, width]).nice();
        yScale.domain([0, freqs.ipmMax]).range([height, 0]).nice();

        xAxis.scale(xScale)
        .tickFormat(d => d + freqs.yearFirst);
        yAxis.scale(yScale)
        .ticks(6)
        // .ticks(10, freqs.ipmMax > 1 ? 'd' : '.2')
        // .tickFormat(d => d/1000 >= 1 ? d/1000+'т' : d);
        .tickFormat(d => d3.format(d<1? '.2': d > 1000 ? '.2s' : 'd')(d));


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

        if (dots) {
          svg.selectAll('.dots').remove();
        }
        dots = svg.selectAll('.dots').data(freqs.ipms);

        dots
          .enter()
          .append('circle')
          .attr('class', 'dots')
          .attr('cx', function(d, i) {
            return xScale(i);
          })
          .attr('cy', function(d) {
            return yScale(d || 0);
          })
          .attr('r', 0)
          // .style("fill", "#2196F3")
          .attr('fill', '#42b983')
          // .attr('stroke', '#42b983')
          // .attr('stroke-width', 1)
          .transition()
          // .duration(1000)
          .delay((d, i) => i * 10)
          .attr('r', d => (d ? 2 : 0));

        // dots.exit().remove();

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
          width = resizeState.dimensions.width - margin.left - margin.right;
          // height = resizeState.dimensions.height - margin.top - margin.bottom;
          height = resizeState.dimensions.height;
          updateChart();
        });

        watch(
          () => [props.tokens, props.corpus],
          (newVal, preVal) => {
            if (props.tokens?.length) {
              console.log('data updated', 'new:', newVal, 'pre', preVal);
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
          svg.setAttribute('viewBox', `-10 -10 ${width + 20} ${height + 40}`);
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
        const filename = tkn + '-' + store.getFormattedTime();

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
    /* display: block;
    fill: none;
    stroke: none;


    background: #eee;
    */
    overflow: visible;
    width: 100%;
    height: 100%;
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
