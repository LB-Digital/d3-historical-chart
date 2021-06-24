import * as d3 from 'd3';


export default class CandlestickChartAxes {


    private _groupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    private _xAxisSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    private _yAxisSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

    constructor(innerGroupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
        // append group for axes
        this._groupSelection = innerGroupSelection.append('g')
            .attr('id', 'axes');

        // append x axis and y axis to axes group
        this._xAxisSelection = this._groupSelection.append('g')
            .attr('id', 'xAxis');

        this._yAxisSelection = this._groupSelection.append('g')
            .attr('id', 'yAxis');
    }


    _draw(
        xAxisPos: number, yAxisPos: number,
        xScale: d3.ScaleTime<number, number>, yScale: d3.ScaleLinear<number, number>
    ) {
        // move x axis to bottom of chart
        this._xAxisSelection
            .attr('transform', `translate(0, ${xAxisPos})`);

        // move y axis to right of chart
        this._yAxisSelection
            .attr('transform', `translate(${yAxisPos}, 0)`);

        // draw x axis
        this._xAxisSelection.call(
            d3.axisBottom(xScale)
            // .tickValues(data.map(d => d.date).filter((_, i) => (i%40 === 0)))
            // .tickFormat(d3.timeFormat('%a %d %b'))
            // .ticks(10)
        );

        // draw y axis
        this._yAxisSelection.call(
            d3.axisRight(yScale)
        );
    }


    get draw() {
        return this._draw;
    }
}