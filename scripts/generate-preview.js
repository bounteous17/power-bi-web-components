const fs = require('fs');
const path = require('path');

// Read the visual.ts to extract the Visual class logic
const visualPath = path.join(__dirname, '..', 'src', 'visual.ts');
const stylePath = path.join(__dirname, '..', 'style', 'visual.less');

// Read styles and convert LESS to CSS (basic conversion)
let styles = fs.readFileSync(stylePath, 'utf8');
// Remove LESS-specific syntax (nested rules need manual flattening)
styles = styles
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\.empty-state\s*\{([^}]*)\s*p\s*\{([^}]*)\}([^}]*)\s*ul\s*\{([^}]*)\s*li\s*\{([^}]*)\}\s*\}\s*\}/gs,
        `.empty-state {$1}
        .empty-state p {$2}
        .empty-state ul {$4}
        .empty-state ul li {$5}`);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Power BI Visual Preview</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 20px;
            background-color: #1a1a1a;
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .preview-container {
            width: 600px;
            height: 400px;
            margin: 0 auto;
        }

        /* Visual styles */
        .profit-dashboard-container {
            display: flex;
            width: 100%;
            height: 100%;
            background-color: #2B2B2B;
            border-radius: 10px;
            overflow: hidden;
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #FFFFFF;
        }

        .chart-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 16px;
            background-color: #FFFFFF;
            border-radius: 10px;
            margin: 0;
        }

        .chart-content {
            display: flex;
            flex-direction: column;
            gap: 12px;
            height: 100%;
        }

        .chart-header {
            display: flex;
            align-items: center;
            height: 40px;
            padding: 8px 0;
        }

        .chart-title {
            font-family: 'Inter', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: #101010;
            margin: 0;
            padding: 0;
        }

        .chart-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 8px;
            min-height: 250px;
        }

        .donut-chart {
            display: block;
        }

        .arc path {
            cursor: pointer;
            transition: opacity 0.2s;
        }

        .arc path:hover {
            opacity: 0.8;
        }

        .legend-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 4px;
            padding: 4px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px;
        }

        .legend-color {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .legend-label {
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 400;
            color: #101010;
        }

        .kpi-section {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0;
            padding: 0;
        }

        .kpi-card {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 10px 16px;
            border-radius: 10px;
        }

        .kpi-header {
            font-family: 'Inter', sans-serif;
            font-size: 16px;
            font-weight: 600;
            color: #403F3F;
            height: 40px;
            display: flex;
            align-items: center;
            padding: 8px 0;
        }

        .kpi-value {
            font-family: 'Inter', sans-serif;
            font-size: 24px;
            font-weight: 600;
            color: #101010;
            line-height: 1;
        }

        .kpi-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 400;
            color: #403F3F;
            margin-top: 2px;
        }

        .chart-tooltip {
            position: fixed;
            background-color: #FFFFFF;
            border-radius: 6px;
            padding: 8px;
            box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1),
                        0px 2px 4px -2px rgba(0, 0, 0, 0.1);
            pointer-events: none;
            z-index: 1000;
        }

        .tooltip-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .tooltip-value {
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 400;
            color: #101010;
        }
    </style>
</head>
<body>
    <div class="preview-container" id="visual-container"></div>

    <script>
        // Mock Visual class
        class Visual {
            constructor(options) {
                this.target = options.element;
                this.colors = [
                    "#35CDB9", "#D87173", "#137D1A", "#475EF8", "#EE4DDB"
                ];

                this.container = document.createElement("div");
                this.container.className = "profit-dashboard-container";
                this.target.appendChild(this.container);

                this.chartContainer = document.createElement("div");
                this.chartContainer.className = "chart-section";
                this.container.appendChild(this.chartContainer);

                this.kpiContainer = document.createElement("div");
                this.kpiContainer.className = "kpi-section";
                this.container.appendChild(this.kpiContainer);
            }

            update(data) {
                this.renderChartSection(data.categories, data.values);
                this.renderKPISection(data.grossProfitMargin, data.profitAmount, data.cogs, data.ebitda);
            }

            renderChartSection(categories, values) {
                this.chartContainer.innerHTML = \`
                    <div class="chart-content">
                        <div class="chart-header">
                            <h3 class="chart-title">Profit</h3>
                        </div>
                        <div class="chart-wrapper">
                            <svg class="donut-chart"></svg>
                        </div>
                        <div class="legend-container"></div>
                    </div>
                \`;

                const svg = d3.select(this.chartContainer).select(".donut-chart");
                const legendContainer = this.chartContainer.querySelector(".legend-container");

                const width = 250;
                const height = 250;
                const radius = Math.min(width, height) / 2;

                svg.attr("width", width).attr("height", height);

                const g = svg.append("g")
                    .attr("transform", \`translate(\${width / 2}, \${height / 2})\`);

                const pie = d3.pie()
                    .value(d => d.value)
                    .sort(null);

                const arc = d3.arc()
                    .innerRadius(radius * 0.6)
                    .outerRadius(radius);

                const data = categories.map((cat, i) => ({
                    label: cat,
                    value: values[i] || 0
                }));

                const arcs = g.selectAll(".arc")
                    .data(pie(data))
                    .enter()
                    .append("g")
                    .attr("class", "arc");

                arcs.append("path")
                    .attr("d", arc)
                    .attr("fill", (d, i) => this.colors[i % this.colors.length])
                    .attr("stroke", "#2B2B2B")
                    .attr("stroke-width", 2)
                    .on("mouseover", (event, d) => {
                        this.showTooltip(event, d.data);
                    })
                    .on("mouseout", () => {
                        this.hideTooltip();
                    });

                this.renderLegend(legendContainer, data);
            }

            renderLegend(container, data) {
                container.innerHTML = "";

                data.forEach((item, index) => {
                    const legendItem = document.createElement("div");
                    legendItem.className = "legend-item";

                    const colorDot = document.createElement("div");
                    colorDot.className = "legend-color";
                    colorDot.style.backgroundColor = this.colors[index % this.colors.length];

                    const label = document.createElement("span");
                    label.className = "legend-label";
                    label.textContent = item.label;

                    legendItem.appendChild(colorDot);
                    legendItem.appendChild(label);
                    container.appendChild(legendItem);
                });
            }

            renderKPISection(grossProfitMargin, profitAmount, cogs, ebitda) {
                this.kpiContainer.innerHTML = \`
                    <div class="kpi-card">
                        <div class="kpi-header">Gross Profit Margin</div>
                        <div class="kpi-value">\${grossProfitMargin}%</div>
                        <div class="kpi-subtitle">Profit: $\${profitAmount}bn</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-header">COGS</div>
                        <div class="kpi-value">$\${cogs}M</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-header">EBITDA</div>
                        <div class="kpi-value">$\${ebitda}bn</div>
                    </div>
                \`;
            }

            showTooltip(event, data) {
                const tooltip = document.createElement("div");
                tooltip.className = "chart-tooltip";
                tooltip.innerHTML = \`
                    <div class="tooltip-content">
                        <div class="tooltip-value">\${data.label}: \${data.value}</div>
                    </div>
                \`;
                tooltip.style.left = event.pageX + 10 + "px";
                tooltip.style.top = event.pageY - 10 + "px";

                document.body.appendChild(tooltip);
            }

            hideTooltip() {
                const tooltips = document.querySelectorAll(".chart-tooltip");
                tooltips.forEach(tooltip => tooltip.remove());
            }
        }

        // Initialize visual with mock data
        const visual = new Visual({
            element: document.getElementById('visual-container')
        });

        // Mock data
        visual.update({
            categories: ["Brand A", "Brand B", "Brand C", "Brand D", "Brand E"],
            values: [30, 25, 20, 15, 10],
            grossProfitMargin: 57,
            profitAmount: 2.12,
            cogs: 135,
            ebitda: 2.54
        });
    </script>
</body>
</html>`;

const outputPath = path.join(__dirname, '..', 'preview.html');
fs.writeFileSync(outputPath, html);
console.log('Preview generated at:', outputPath);
