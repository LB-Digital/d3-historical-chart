import * as d3 from 'd3';
import {CandlestickDatum} from '../../types/CandlestickDatum';


export default class ClosePriceLine {

    private _pathSelection: d3.Selection<SVGPathElement, unknown, HTMLElement, any>;

    constructor(chartLinesGroupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
        // add close line path
        this._pathSelection = chartLinesGroupSelection.append('path')
            .attr('id', 'closeLine')
            .style('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', '1.5');
    }


    private _draw(
        xScale: d3.ScaleTime<number, number>,
        yScale: d3.ScaleLinear<number, number>,
        data: CandlestickDatum[]
    ) {
        // draw close price line
        const line = d3.line<CandlestickDatum>()
            .x(d => xScale(d.date))
            .y(d => yScale(d.close));

        this._pathSelection
            .data([data])
            .attr('d', line);
    }

    get draw() {
        return this._draw;
    }
}