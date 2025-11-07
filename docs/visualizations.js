// Visualization functions using D3.js
let data = null;

// Load data
fetch('data.json')
    .then(response => response.json())
    .then(d => {
        data = d;
        initializeVisualizations();
    });

function initializeVisualizations() {
    createScatterPlot();
    createOccupationChart();
    createViralList();
    createTimelineChart();
}

// Utility: Format numbers
function formatViews(views) {
    if (views >= 1e6) return (views / 1e6).toFixed(1) + 'M';
    if (views >= 1e3) return (views / 1e3).toFixed(0) + 'K';
    return views.toString();
}

// Scatter plot: Word count vs Views
function createScatterPlot() {
    const container = d3.select('#scatter-viz');
    container.selectAll('*').remove();

    const margin = {top: 40, right: 60, bottom: 60, left: 80};
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data.talks, d => d.first_line_word_count)])
        .range([0, width]);

    const yScale = d3.scaleLog()
        .domain([10000, d3.max(data.talks, d => d.views)])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain([true, false])
        .range(['#eb3941', '#95a5a6']);

    // Axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 50)
        .attr('class', 'chart-label')
        .style('text-anchor', 'middle')
        .text('Opening Line Word Count');

    svg.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d => formatViews(d)))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .attr('class', 'chart-label')
        .style('text-anchor', 'middle')
        .text('Views (log scale)');

    // Tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip');

    // Dots
    const dots = svg.selectAll('circle')
        .data(data.talks)
      .enter().append('circle')
        .attr('cx', d => xScale(d.first_line_word_count))
        .attr('cy', d => yScale(d.views))
        .attr('r', 4)
        .attr('fill', d => colorScale(d.has_laughter))
        .attr('opacity', 0.6)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('r', 6)
                .attr('opacity', 1);

            tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .classed('show', true)
                .html(`
                    <strong>${d.title}</strong><br>
                    ${d.speaker_1}<br>
                    Views: ${formatViews(d.views)}<br>
                    ${d.has_laughter ? '😂 Has laughter' : 'No laughter'}
                `);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('r', 4)
                .attr('opacity', 0.6);
            tooltip.classed('show', false);
        });

    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 150}, 20)`);

    [[true, 'With laughter'], [false, 'No laughter']].forEach((item, i) => {
        const g = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);

        g.append('circle')
            .attr('r', 5)
            .attr('fill', colorScale(item[0]));

        g.append('text')
            .attr('x', 15)
            .attr('y', 5)
            .style('font-size', '14px')
            .style('font-family', 'var(--font-sans)')
            .text(item[1]);
    });

    // Filter controls
    function updateFilters() {
        const showLaughter = document.getElementById('filter-laughter').checked;
        const showNoLaughter = document.getElementById('filter-no-laughter').checked;
        const minViews = +document.getElementById('views-slider').value;

        document.getElementById('views-display').textContent = formatViews(minViews);

        dots.style('display', d => {
            if (!showLaughter && d.has_laughter) return 'none';
            if (!showNoLaughter && !d.has_laughter) return 'none';
            if (d.views < minViews) return 'none';
            return 'block';
        });
    }

    document.getElementById('filter-laughter').addEventListener('change', updateFilters);
    document.getElementById('filter-no-laughter').addEventListener('change', updateFilters);
    document.getElementById('views-slider').addEventListener('input', updateFilters);
}

// Occupation bar chart
function createOccupationChart() {
    const container = d3.select('#occupation-viz');
    container.selectAll('*').remove();

    const margin = {top: 40, right: 60, bottom: 60, left: 150};
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data.occupation_stats, d => d.median_views)])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(data.occupation_stats.map(d => d.occupation))
        .range([0, height])
        .padding(0.2);

    const colorScale = d3.scaleSequential()
        .domain([0, data.occupation_stats.length - 1])
        .interpolator(d3.interpolateReds);

    // Axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d => formatViews(d)));

    svg.append('g')
        .call(d3.axisLeft(yScale));

    // Bars
    svg.selectAll('rect')
        .data(data.occupation_stats)
      .enter().append('rect')
        .attr('x', 0)
        .attr('y', d => yScale(d.occupation))
        .attr('width', d => xScale(d.median_views))
        .attr('height', yScale.bandwidth())
        .attr('fill', (d, i) => colorScale(i))
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);

            const tooltip = d3.select('.tooltip');
            tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .classed('show', true)
                .html(`
                    <strong>${d.occupation}</strong><br>
                    Median views: ${formatViews(d.median_views)}<br>
                    Sample size: ${d.count} talks
                `);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            d3.select('.tooltip').classed('show', false);
        });

    // Value labels
    svg.selectAll('text.value-label')
        .data(data.occupation_stats)
      .enter().append('text')
        .attr('class', 'value-label')
        .attr('x', d => xScale(d.median_views) + 10)
        .attr('y', d => yScale(d.occupation) + yScale.bandwidth() / 2 + 5)
        .style('font-size', '14px')
        .style('font-family', 'var(--font-sans)')
        .style('font-weight', '600')
        .text(d => formatViews(d.median_views));
}

// Viral talks list
function createViralList() {
    const container = d3.select('#viral-list');
    container.selectAll('*').remove();

    data.viral_talks.forEach((talk, i) => {
        const item = container.append('div')
            .attr('class', 'viral-item');

        item.append('div')
            .attr('class', 'viral-rank')
            .text(i + 1);

        const content = item.append('div')
            .attr('class', 'viral-content');

        content.append('h3')
            .html(`<a href="${talk.url}" target="_blank">${talk.title}</a>`);

        content.append('div')
            .attr('class', 'viral-speaker')
            .text(talk.speaker_1);

        content.append('div')
            .attr('class', 'viral-views')
            .text(`${formatViews(talk.views)} views`);

        content.append('div')
            .attr('class', 'viral-opener')
            .text(`"${talk.first_line.substring(0, 150)}..."`);
    });
}

// Timeline chart
function createTimelineChart() {
    const container = d3.select('#timeline-viz');
    container.selectAll('*').remove();

    const margin = {top: 40, right: 60, bottom: 60, left: 80};
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data.timeline_data, d => d.year))
        .range([0, width]);

    const y1Scale = d3.scaleLinear()
        .domain([0, d3.max(data.timeline_data, d => d.count)])
        .range([height, 0]);

    const y2Scale = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

    // Axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));

    svg.append('g')
        .call(d3.axisLeft(y1Scale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .attr('class', 'chart-label')
        .style('text-anchor', 'middle')
        .text('Number of Talks');

    svg.append('g')
        .attr('transform', `translate(${width},0)`)
        .call(d3.axisRight(y2Scale).tickFormat(d => (d * 100).toFixed(0) + '%'))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 50)
        .attr('class', 'chart-label')
        .style('text-anchor', 'middle')
        .text('% With Laughter');

    // Area for talk count
    const area = d3.area()
        .x(d => xScale(d.year))
        .y0(height)
        .y1(d => y1Scale(d.count));

    svg.append('path')
        .datum(data.timeline_data)
        .attr('d', area)
        .attr('fill', '#95e1d3')
        .attr('opacity', 0.5);

    // Line for laughter percentage
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => y2Scale(d.laughter_pct));

    svg.append('path')
        .datum(data.timeline_data)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#eb3941')
        .attr('stroke-width', 3);

    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(20, 20)`);

    [['Talk volume', '#95e1d3'], ['% with laughter', '#eb3941']].forEach((item, i) => {
        const g = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);

        g.append('rect')
            .attr('width', 20)
            .attr('height', 3)
            .attr('fill', item[1]);

        g.append('text')
            .attr('x', 30)
            .attr('y', 5)
            .style('font-size', '14px')
            .style('font-family', 'var(--font-sans)')
            .text(item[0]);
    });
}

// Export for use in main.js
window.visualizations = {
    createScatterPlot,
    createOccupationChart,
    createViralList,
    createTimelineChart
};
