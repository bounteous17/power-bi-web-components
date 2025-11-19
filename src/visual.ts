import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import * as d3 from "d3";

export class Visual implements IVisual {
    private target: HTMLElement;
    private container: HTMLElement;

    // Colors from the SVG design
    private lineColor: string = "#475EF8";
    private gridColor: string = "#504E4F";
    private axisLabelColor: string = "#7F7F7F";
    private titleColor: string = "#DCDADA";

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;

        // Create main container
        this.container = document.createElement("div");
        this.container.className = "chart-container";
        this.target.appendChild(this.container);
    }

    public update(options: VisualUpdateOptions) {
        const dataView: DataView = options.dataViews && options.dataViews[0];

        let chartData: { category: string; count: number }[] = [];

        // Extract data from Power BI dataView
        if (dataView && dataView.categorical) {
            const categorical = dataView.categorical;
            const categories = categorical.categories ? categorical.categories[0].values : [];

            // Get the count values from the measure (values field)
            const values = categorical.values && categorical.values[0] ? categorical.values[0].values : [];

            if (categories.length > 0 && values.length > 0) {
                // Use the values from Power BI (which should be the count measure)
                chartData = categories.map((cat, i) => ({
                    category: String(cat),
                    count: Number(values[i]) || 0
                }));
            } else if (categories.length > 0) {
                // Fallback: if no measure provided, count occurrences manually
                // This works when using table/matrix data role instead of categorical
                const countMap = new Map<string, number>();
                categories.forEach(cat => {
                    const key = String(cat);
                    countMap.set(key, (countMap.get(key) || 0) + 1);
                });

                chartData = Array.from(countMap.entries()).map(([category, count]) => ({
                    category,
                    count
                }));
            }
        }

        // Show message if no data is available
        if (chartData.length === 0) {
            this.container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #7F7F7F; font-size: 14px;">Please select a category column</div>';
            return;
        }

        this.renderChart(chartData);
    }

    private renderChart(data: { category: string; count: number }[]) {
        this.container.innerHTML = "";

        // SVG dimensions matching the design (460 x 404 viewBox)
        const width = 460;
        const height = 404;

        // Chart area boundaries from SVG
        const chartLeft = 52;
        const chartRight = 436;
        const chartTop = 80;
        const chartBottom = 319;

        // Create SVG with viewBox for responsiveness
        const svg = d3.select(this.container)
            .append("svg")
            .attr("class", "chart-svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Add title
        svg.append("text")
            .attr("x", 17)
            .attr("y", 41)
            .attr("fill", this.titleColor)
            .attr("font-size", "14px")
            .attr("font-weight", "500")
            .text("Inventory");

        // Calculate max count for Y-axis scale
        const maxCount = Math.max(...data.map(d => d.count));
        const yMax = Math.ceil(maxCount / 10) * 10 || 10; // Round up to nearest 10

        // Scales
        const xScale = d3.scalePoint<string>()
            .domain(data.map(d => d.category))
            .range([chartLeft, chartRight]);

        const yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([chartBottom, chartTop]);

        // Y-axis tick values and positions (dynamic based on max count)
        const yTicks = [];
        for (let i = yMax; i >= 0; i -= yMax / 5) {
            yTicks.push(Math.round(i));
        }

        // Draw horizontal grid lines (dashed except bottom)
        yTicks.forEach((tick, i) => {
            const y = yScale(tick);
            svg.append("line")
                .attr("x1", chartLeft)
                .attr("x2", chartRight)
                .attr("y1", y)
                .attr("y2", y)
                .attr("stroke", this.gridColor)
                .attr("stroke-width", 0.88398)
                .attr("stroke-dasharray", i === yTicks.length - 1 ? "0" : "1.77");
        });

        // Draw vertical grid lines (dashed)
        data.forEach(d => {
            const x = xScale(d.category);
            if (x !== undefined) {
                svg.append("line")
                    .attr("x1", x)
                    .attr("x2", x)
                    .attr("y1", chartTop)
                    .attr("y2", chartBottom)
                    .attr("stroke", this.gridColor)
                    .attr("stroke-width", 0.88398)
                    .attr("stroke-dasharray", "1.77");
            }
        });

        // Y-axis labels
        yTicks.forEach(tick => {
            svg.append("text")
                .attr("x", 36)
                .attr("y", yScale(tick))
                .attr("text-anchor", "end")
                .attr("dominant-baseline", "middle")
                .attr("fill", this.axisLabelColor)
                .attr("font-size", "11px")
                .text(tick);
        });

        // X-axis labels
        data.forEach(d => {
            const x = xScale(d.category);
            if (x !== undefined) {
                svg.append("text")
                    .attr("x", x)
                    .attr("y", 333)
                    .attr("text-anchor", "middle")
                    .attr("fill", this.titleColor)
                    .attr("font-size", "11px")
                    .text(d.category);
            }
        });

        // Create line generator with cardinal curve
        const line = d3.line<{ category: string; count: number }>()
            .x(d => xScale(d.category) || 0)
            .y(d => yScale(d.count))
            .curve(d3.curveCardinal.tension(0.5));

        // Draw data line
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", this.lineColor)
            .attr("stroke-width", 2)
            .attr("d", line);

        // Draw data points
        data.forEach(d => {
            const x = xScale(d.category);
            const y = yScale(d.count);

            if (x !== undefined) {
                // Outer glow circle (25% opacity)
                svg.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 7)
                    .attr("fill", this.lineColor)
                    .attr("opacity", 0.25);

                // Inner circle with white stroke
                svg.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 4)
                    .attr("fill", this.lineColor)
                    .attr("stroke", "white")
                    .attr("stroke-width", 0.88398);
            }
        });

        // Draw legend
        const legendGroup = svg.append("g")
            .attr("transform", "translate(158, 368)");

        // Legend glow circle
        legendGroup.append("circle")
            .attr("cx", 8)
            .attr("cy", 0)
            .attr("r", 8)
            .attr("fill", this.lineColor)
            .attr("opacity", 0.25);

        // Legend inner circle
        legendGroup.append("circle")
            .attr("cx", 8)
            .attr("cy", 0)
            .attr("r", 3.5)
            .attr("fill", this.lineColor)
            .attr("stroke", "white")
            .attr("stroke-width", 1);

        // Legend text
        legendGroup.append("text")
            .attr("x", 24)
            .attr("y", 5)
            .attr("fill", this.titleColor)
            .attr("font-size", "11px")
            .text("Inventory Turnover");
    }
}
