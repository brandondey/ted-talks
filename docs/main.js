// Main application logic and scrollytelling

// Wait for DOM and data to load
document.addEventListener('DOMContentLoaded', function() {
    initializeScrollytelling();
});

function initializeScrollytelling() {
    // Initialize scrollama for laughter section
    const laughterScroller = scrollama();

    laughterScroller
        .setup({
            step: '#laughter-section .step',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(response => {
            // Update active state
            document.querySelectorAll('#laughter-section .step').forEach(step => {
                step.classList.remove('is-active');
            });
            response.element.classList.add('is-active');

            // Update visualization based on step
            updateLaughterViz(response.index);
        });

    // Initialize scrollama for questions section
    const questionsScroller = scrollama();

    questionsScroller
        .setup({
            step: '#questions-section .step',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(response => {
            document.querySelectorAll('#questions-section .step').forEach(step => {
                step.classList.remove('is-active');
            });
            response.element.classList.add('is-active');

            updateQuestionsViz(response.index);
        });

    // Handle window resize
    window.addEventListener('resize', () => {
        laughterScroller.resize();
        questionsScroller.resize();

        // Redraw visualizations
        if (window.visualizations) {
            window.visualizations.createScatterPlot();
            window.visualizations.createOccupationChart();
            window.visualizations.createTimelineChart();
        }
    });
}

function updateLaughterViz(step) {
    const container = d3.select('#laughter-viz');
    container.selectAll('*').remove();

    const margin = {top: 40, right: 40, bottom: 60, left: 80};
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = container.node().getBoundingClientRect().height - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    if (step === 0) {
        // Step 0: Show question mark
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '120px')
            .style('fill', '#eb3941')
            .text('?');

    } else if (step === 1 || step === 2) {
        // Steps 1-2: Show comparison bars
        const barData = [
            {label: 'With (Laughter)', value: 2.42, color: '#eb3941'},
            {label: 'Without', value: 1.68, color: '#95a5a6'}
        ];

        const xScale = d3.scaleBand()
            .domain(barData.map(d => d.label))
            .range([0, width])
            .padding(0.3);

        const yScale = d3.scaleLinear()
            .domain([0, 3])
            .range([height, 0]);

        // Axes
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        svg.append('g')
            .call(d3.axisLeft(yScale))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -60)
            .attr('class', 'chart-label')
            .style('text-anchor', 'middle')
            .text('Average Views (Millions)');

        // Bars with animation
        svg.selectAll('rect')
            .data(barData)
          .enter().append('rect')
            .attr('x', d => xScale(d.label))
            .attr('y', height)
            .attr('width', xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', d => d.color)
            .transition()
            .duration(1000)
            .attr('y', d => yScale(d.value))
            .attr('height', d => height - yScale(d.value));

        // Value labels
        svg.selectAll('text.value')
            .data(barData)
          .enter().append('text')
            .attr('class', 'value')
            .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.value) - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .style('fill', d => d.color)
            .text(d => d.value + 'M');

        if (step === 2) {
            // Add highlight for 44% increase
            const increase = ((2.42 - 1.68) / 1.68 * 100).toFixed(0);
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '48px')
                .style('font-weight', 'bold')
                .style('fill', '#eb3941')
                .text(`+${increase}%`);
        }

    } else if (step === 3) {
        // Step 3: Show sample transcript snippet
        const transcriptText = [
            'Transcript excerpt:',
            '',
            '"In fact, I\'m leaving."',
            '(Laughter)',
            '',
            'This laughter marker',
            'is quantifiable data.'
        ];

        svg.append('text')
            .selectAll('tspan')
            .data(transcriptText)
            .enter()
            .append('tspan')
            .attr('x', width / 2)
            .attr('y', (d, i) => height / 2 - 70 + i * 30)
            .attr('text-anchor', 'middle')
            .style('font-size', d => d === '(Laughter)' ? '32px' : '20px')
            .style('font-weight', d => d === '(Laughter)' ? 'bold' : 'normal')
            .style('fill', d => d === '(Laughter)' ? '#eb3941' : '#333')
            .style('font-family', d => d.includes('Transcript') || d.includes('laughter') || d.includes('data') ? 'var(--font-sans)' : 'var(--font-mono)')
            .text(d => d);
    }
}

function updateQuestionsViz(step) {
    const container = d3.select('#questions-viz');
    container.selectAll('*').remove();

    const margin = {top: 40, right: 40, bottom: 60, left: 80};
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = container.node().getBoundingClientRect().height - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    if (step === 0) {
        // Step 0: Show question mark icon
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '120px')
            .style('fill', '#95a5a6')
            .text('?');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2 + 80)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('font-family', 'var(--font-sans)')
            .style('fill', '#666')
            .text('Conventional wisdom');

    } else if (step === 1 || step === 2) {
        // Steps 1-2: Show comparison bars
        const barData = [
            {label: 'Questions', value: 0.72, color: '#e74c3c'},
            {label: 'Statements', value: 1.38, color: '#27ae60'}
        ];

        const xScale = d3.scaleBand()
            .domain(barData.map(d => d.label))
            .range([0, width])
            .padding(0.3);

        const yScale = d3.scaleLinear()
            .domain([0, 1.6])
            .range([height, 0]);

        // Axes
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        svg.append('g')
            .call(d3.axisLeft(yScale))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -60)
            .attr('class', 'chart-label')
            .style('text-anchor', 'middle')
            .text('Median Views (Millions)');

        // Bars
        svg.selectAll('rect')
            .data(barData)
          .enter().append('rect')
            .attr('x', d => xScale(d.label))
            .attr('y', height)
            .attr('width', xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', d => d.color)
            .transition()
            .duration(1000)
            .attr('y', d => yScale(d.value))
            .attr('height', d => height - yScale(d.value));

        // Value labels
        svg.selectAll('text.value')
            .data(barData)
          .enter().append('text')
            .attr('class', 'value')
            .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.value) - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .style('fill', d => d.color)
            .text(d => d.value + 'M');

        if (step === 2) {
            // Add stat
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', 30)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .style('font-family', 'var(--font-sans)')
                .style('fill', '#e74c3c')
                .text('Only 0.6% of talks start with questions');
        }

    } else if (step === 3) {
        // Step 3: Show cognitive load concept
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2 - 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '28px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('Questions create cognitive load');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2 + 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('fill', '#666')
            .text('The audience thinks instead of listens');
    }
}

// Close word examples
function closeWordExamples() {
    document.getElementById('word-examples').classList.add('hidden');
}

// Make function available globally
window.closeWordExamples = closeWordExamples;

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
