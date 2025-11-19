import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import * as d3 from "d3";

export class Visual implements IVisual {
    private target: HTMLElement;
    private container: HTMLElement;

    // Chart colors matching Figma design (from SVG)
    private lineColor: string = "#475EF8";
    private areaColor: string = "rgba(71, 94, 248, 0.2)";
    private gridColor: string = "#504E4F";
    private textColor: string = "#DCDADA";

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;

        // Create main container
        this.container = document.createElement("div");
        this.container.className = "line-chart-container";
        this.target.appendChild(this.container);
    }

    public update(options: VisualUpdateOptions) {
        const dataView: DataView = options.dataViews && options.dataViews[0];

        // Default data matching the Figma design
        const defaultData = [
            { month: "JAN", value: 38 },
            { month: "FEB", value: 42 },
            { month: "MAR", value: 44 },
            { month: "APR", value: 53 },
            { month: "MAY", value: 48 },
            { month: "JUN", value: 14 },
            { month: "JUL", value: 16 },
            { month: "AUG", value: 10 },
            { month: "SEP", value: 19 },
            { month: "OCT", value: 17 },
            { month: "NOV", value: 16 },
            { month: "DEC", value: 17 },
            { month: "", value: 21 }
        ];

        let chartData = defaultData;

        // Extract data from Power BI if available
        if (dataView && dataView.categorical) {
            const categorical = dataView.categorical;
            const categories = categorical.categories ? categorical.categories[0].values : [];
            const values = categorical.values && categorical.values[0] ? categorical.values[0].values : [];

            if (categories.length > 0 && values.length > 0) {
                chartData = categories.map((cat, i) => ({
                    month: String(cat),
                    value: Number(values[i]) || 0
                }));
            }
        }

        this.renderChart(chartData);
    }

    private renderChart(data: { month: string; value: number }[]) {
        this.container.innerHTML = "";

        // Get container dimensions
        const containerRect = this.target.getBoundingClientRect();
        const width = containerRect.width || 800;
        const height = containerRect.height || 400;
        const margin = { top: 40, right: 40, bottom: 60, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(this.container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "line-chart-svg");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Scales
        const xScale = d3.scalePoint<string>()
            .domain(data.map(d => d.month))
            .range([0, chartWidth])
            .padding(0.5);

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([chartHeight, 0]);

        // Draw horizontal grid lines
        const yTicks = [0, 20, 40, 60, 80, 100];
        yTicks.forEach(tick => {
            g.append("line")
                .attr("x1", 0)
                .attr("x2", chartWidth)
                .attr("y1", yScale(tick))
                .attr("y2", yScale(tick))
                .attr("stroke", this.gridColor)
                .attr("stroke-width", 0.88)
                .attr("stroke-dasharray", tick === 0 ? "0" : "1.77");
        });

        // Draw vertical grid lines
        data.forEach(d => {
            const x = xScale(d.month);
            if (x !== undefined) {
                g.append("line")
                    .attr("x1", x)
                    .attr("x2", x)
                    .attr("y1", 0)
                    .attr("y2", chartHeight)
                    .attr("stroke", this.gridColor)
                    .attr("stroke-width", 0.88)
                    .attr("stroke-dasharray", "1.77");
            }
        });

        // Y-axis labels
        yTicks.forEach(tick => {
            g.append("text")
                .attr("x", -10)
                .attr("y", yScale(tick))
                .attr("dy", "0.35em")
                .attr("text-anchor", "end")
                .attr("fill", this.textColor)
                .attr("font-size", "12px")
                .attr("font-family", "'Inter', sans-serif")
                .text(tick);
        });

        // X-axis labels
        data.forEach(d => {
            const x = xScale(d.month);
            if (x !== undefined && d.month) {
                g.append("text")
                    .attr("x", x)
                    .attr("y", chartHeight + 30)
                    .attr("text-anchor", "middle")
                    .attr("fill", this.textColor)
                    .attr("font-size", "12px")
                    .attr("font-family", "'Inter', sans-serif")
                    .text(d.month);
            }
        });

        // Create area generator with curve
        const area = d3.area<{ month: string; value: number }>()
            .x(d => xScale(d.month) || 0)
            .y0(chartHeight)
            .y1(d => yScale(d.value))
            .curve(d3.curveCardinal.tension(0.4));

        // Draw area
        g.append("path")
            .datum(data)
            .attr("fill", this.areaColor)
            .attr("d", area);

        // Create line generator with curve
        const line = d3.line<{ month: string; value: number }>()
            .x(d => xScale(d.month) || 0)
            .y(d => yScale(d.value))
            .curve(d3.curveCardinal.tension(0.4));

        // Draw line
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", this.lineColor)
            .attr("stroke-width", 3)
            .attr("d", line);

        // Draw data points and labels
        data.forEach(d => {
            const x = xScale(d.month);
            const y = yScale(d.value);

            if (x !== undefined) {
                // Outer glow circle (0.25 opacity)
                g.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 7)
                    .attr("fill", this.lineColor)
                    .attr("opacity", 0.25);

                // Inner circle with white stroke
                g.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 3.5)
                    .attr("fill", this.lineColor)
                    .attr("stroke", "white")
                    .attr("stroke-width", 0.88);

                // Value label above point
                g.append("text")
                    .attr("x", x)
                    .attr("y", y - 15)
                    .attr("text-anchor", "middle")
                    .attr("fill", this.textColor)
                    .attr("font-size", "12px")
                    .attr("font-weight", "400")
                    .attr("font-family", "'Inter', sans-serif")
                    .text(d.value);
            }
        });
    }
}
