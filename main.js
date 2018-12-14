document.addEventListener('DOMContentLoaded', () => {
  const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';

  function initialize(data) {
    const dataset = data.monthlyVariance;

    // Set graph dimensions
    const fullWidth = 1400;
    const fullHeight = 700;

    const margin = { top: 100, right: 50, bottom: 150, left: 150 };
    const width = fullWidth - margin.right - margin.left;
    const height = fullHeight - margin.top - margin.bottom;

    // Format the date
    const formatMonth = d3.timeFormat('%B');
    const formatTemp = d3.format('.1f');

    // Set tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('id', 'tooltip')
      .style('opacity', 0);

    const textTooltip = d => (
      `${d.year} - ${formatMonth(new Date(0, d.month - 1))}<br>
      ${(data.baseTemperature + d.variance).toFixed(1)}&deg;C<br>
      ${d.variance.toFixed(1)}&deg;C`
    );

    // Set domains
    const xMin = d3.min(dataset, d => d.year);
    const xMax = d3.max(dataset, d => d.year);

    const monthDomain = dataset.map(d => d.month - 1)
      .filter((item, pos, self) => self.indexOf(item) === pos)
      .map(item => formatMonth(new Date(2000, item)));

    // Set scales
    const xScale = d3.scaleLinear()
      .domain([xMin, xMax])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(monthDomain)
      .range([0, height]);
      // .paddingInner(0.05);

    // Set legend
    const minTemp = d3.min(dataset, d => d.variance) + data.baseTemperature;
    const maxTemp = d3.max(dataset, d => d.variance) + data.baseTemperature;

    const legColors = [
      '#253494',
      '#2c7fb8',
      '#41b6c4',
      '#7fcdbb',
      '#c7e9b4',
      '#fef0d9',
      '#fdd49e',
      '#fdbb84',
      '#fc8d59',
      '#e34a33',
      '#b30000',
    ];
    const legWidth = 350;
    const legHeight = 300 / legColors.length;

    const legThreshold = d3.scaleThreshold()
      .domain(((min, max, count) => {
        const tempDomain = [];
        const step = (max - min) / count;
        for (let i = 1; i < count; i++) {
          tempDomain.push(min + step * i);
        }
        return tempDomain;
      })(minTemp, maxTemp, legColors.length))
      .range(legColors);

    const legScale = d3.scaleLinear()
      .domain([minTemp, maxTemp])
      .range([0, legWidth]);

    // Chart
    const svg = d3.select('body')
      .append('svg')
      .attr('class', 'map')
      .attr('width', fullWidth)
      .attr('height', fullHeight)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    svg.selectAll('.cell')
      .data(dataset)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('data-month', d => d.month - 1)
      .attr('data-year', d => d.year)
      .attr('data-temp', d => formatTemp(data.baseTemperature + d.variance))
      .attr('x', d => xScale(d.year))
      .attr('width', width / (xMax - xMin + 1))
      .attr('y', d => yScale(formatMonth(new Date(0, d.month - 1))))
      .attr('height', yScale.bandwidth())
      .style('fill', d => legThreshold(d.variance + data.baseTemperature))
      .on('mouseover', (d) => {
        tooltip.attr('data-year', d.year);
        tooltip.transition()
          .duration(100)
          .style('opacity', 0.9);
        tooltip.html(textTooltip(d))
          .style('left', `${d3.event.pageX + 5}px`)
          .style('top', `${d3.event.pageY - 80}px`);
      })
      .on('mouseout', (d) => {
        tooltip.transition()
          .duration(300)
          .style('opacity', 0);
      });

    // X axis
    const xNbTicks = Math.floor((xMax - xMin) / 10);
    const xAxis = d3.axisBottom(xScale)
      .ticks(xNbTicks)
      .tickFormat(d3.format('d'))
      .tickSizeOuter(0);

    svg.append('g')
      .attr('id', 'x-axis')
      .attr('transform', `translate(0, ${height})`)
      .style('font-size', 16)
      .call(xAxis);

    svg.append('text')
      .attr('transform', `translate(${width / 2}, ${height + 60})`)
      .attr('text-anchor', 'middle')
      .style('font-size', 22)
      .text('Years');

    // Y axis
    const yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

    svg.append('g')
      .attr('id', 'y-axis')
      .style('font-size', 16)
      .call(yAxis);

    svg.append('text')
      .attr('transform', `translate(${60 - margin.left}, ${height / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .style('font-size', 22)
      .text('Months');

    // Legend
    const legAxis = d3.axisBottom(legScale)
      .tickFormat(d3.format('.1f'))
      .tickValues(legThreshold.domain())
      .tickSize(8)
      .tickSizeOuter(0);

    const leg = svg.append('g')
      .attr('id', 'legend')
      .attr('transform', `translate(0, ${height + margin.bottom / 2})`);

    leg.append('g')
      .selectAll('rect')
      .data(legThreshold.range().map((color) => {
        const d = legThreshold.invertExtent(color);
        if (!d[0]) return [legScale.domain()[0], d[1]];
        if (!d[1]) return [d[0], legScale.domain()[1]];
        return d;
      }))
      .enter()
      .append('rect')
      .style('fill', d => legThreshold(d[0]))
      .style('stroke', 'black')
      .attr('x', d => legScale(d[0]))
      .attr('y', 0)
      .attr('width', d => legScale(d[1]) - legScale(d[0]))
      .attr('height', legHeight);

    leg.append('g')
      .attr('transform', `translate(0, ${legHeight})`)
      .style('font-size', 14)
      .call(legAxis);

    // Title
    svg.append('text')
      .attr('x', (width / 2))
      .attr('y', (0 - margin.top / 2))
      .attr('id', 'title')
      .attr('text-anchor', 'middle')
      .style('font-size', 26)
      .text('Monthly Global Land-Surface Temperature');

    // Description
    svg.append('text')
      .attr('x', (width / 2))
      .attr('y', (0 - margin.top / 2) + 30)
      .attr('id', 'description')
      .attr('text-anchor', 'middle')
      .style('font-size', 18)
      .html(`${xMin} - ${xMax}: base temperature ${data.baseTemperature}&deg;C`);
  }

  // Fetch data
  fetch(url)
    .then(res => res.json())
    .then(data => initialize(data))
    .catch(err => console.log(err));
});
