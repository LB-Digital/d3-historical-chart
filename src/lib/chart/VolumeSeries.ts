import * as d3 from 'd3'


// types
import type {CandlestickDatum} from '../../types/CandlestickDatum';


/**
 * Class representing volume series on chart
 */
export default class VolumeSeries {
    static DEFAULT_HEIGHT: number = 0.25;
    static CLOSED_LOWER_BAR_COLOR: string = '#c0392b';
    static CLOSED_HIGHER_BAR_COLOR: string = '#03a678';


    private _groupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

    constructor(innerGroupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
        // add group for volume series
        this._groupSelection = innerGroupSelection.append('g')
            .attr('id', 'volumeSeries');
    }


    private _getBarColor = (prevClosePrice: number, closePrice: number): string => (
        (prevClosePrice > closePrice) ? VolumeSeries.CLOSED_LOWER_BAR_COLOR : VolumeSeries.CLOSED_HIGHER_BAR_COLOR
    );


    /**
     * Draw volume series
     * @private
     * @param xScale
     * @param data
     * @param chartHeight
     * @param height - value between 0-1 as percentage of chart height
     */
    private _draw(
        xScale: d3.ScaleTime<number, number>,
        data: CandlestickDatum[],
        chartHeight: number,
        height: number = VolumeSeries.DEFAULT_HEIGHT
    ) {
        const maxBarHeight = chartHeight * height;

        const volData = data.filter((d) => ((d.volume !== null) && (d.volume !== 0)));
        const yMinVolume = d3.min(volData, d => Math.min(d.volume));
        const yMaxVolume = d3.max(volData, d => Math.max(d.volume));

        if (!yMinVolume || !yMaxVolume) {
            throw new Error('Invalid yMinVolume or yMaxVolume');
        }

        const yVolumeScale = d3.scaleLinear()
            .domain([yMinVolume, yMaxVolume])
            .range([maxBarHeight, 0]);

        this._groupSelection.selectAll<SVGRectElement, CandlestickDatum>('rect')
            .data(volData, d => `${d.date.getTime()}`) // use timestamp as unique identifier
            .join(
                // append new bars for each new data point
                (enter) => enter
                    .append('rect')
                    // 1 pixel width
                    .attr('width', 1),
                // updates chained below so that they are performed on enter+update
                (update) => update,
                // remove old bars on exit
                (exit) => exit
                    .remove()
            )
            // convert data point Date to position along x axis
            .attr('x', d => xScale(d.date))
            // convert data point volume to y position
            .attr('y', d => yVolumeScale(d.volume) + (chartHeight - maxBarHeight))
            // height stretches from y position down to x axis
            .attr('height', d => (maxBarHeight - yVolumeScale(d.volume)))
            // bars are green when stock closes higher than prev day's close price, red when lower
            .attr('fill', (d, i) => this._getBarColor(
                (i === 0 ? -1 : volData[i-1].close),
                d.close
            ));
    }

    get draw() {
        return this._draw;
    }
}