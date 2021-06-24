import * as d3 from 'd3';


// types
import type {CandlestickDatum} from '../../types/CandlestickDatum';

export interface MovingAveragePoint {
    date: Date;
    average: number;
}


/**
 * Class representing a simple moving average line on chart
 */
export default class SimpleMovingAverageLine {
    static DEFAULT_NUM_POINTS = 50;

    static getPoints = (data: CandlestickDatum[], numOfPricePoints: number): MovingAveragePoint[] =>
        data.map((dataEntry, index, total) => {
            const start = Math.max(0, index - numOfPricePoints);
            const subset = total.slice(start, index + 1);
            const sum = subset.reduce((prevEntry, currEntry) => {
                return prevEntry + currEntry.close;
            }, 0);

            return {
                date: dataEntry.date,
                average: sum / subset.length
            }
        });



    private _pathSelection: d3.Selection<SVGPathElement, unknown, HTMLElement, any>;

    constructor(chartLinesGroupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
        // add SMA line to chart
        this._pathSelection = chartLinesGroupSelection.append('path')
            .attr('id', 'smaLine')
            .style('fill', 'none')
            .attr('stroke', '#FF8900');
    }


    /**
     * Generates moving average curve
     * @param xScale
     * @param yScale
     */
    private _movingAverageLine = (xScale: d3.ScaleTime<number, number>, yScale: d3.ScaleLinear<number, number>) =>
        d3.line<MovingAveragePoint>()
            .x(d => xScale(d.date))
            .y(d => yScale(d.average))
            .curve(d3.curveBasis);


    private _draw(
        xScale: d3.ScaleTime<number, number>,
        yScale: d3.ScaleLinear<number, number>,
        data: CandlestickDatum[],
        numPoints: number = SimpleMovingAverageLine.DEFAULT_NUM_POINTS
    ) {
        // calculates simple moving average over {numPoints} days
        const points = SimpleMovingAverageLine.getPoints(data, numPoints);

        // get moving average line generator
        const line = this._movingAverageLine(xScale, yScale);

        // update SMA line
        this._pathSelection
            .data([points])
            .attr('d', line);
    }

    get draw() {
        return this._draw;
    }

}