import * as d3 from 'd3';


// lib
import getTagPolygonPath from '../svg/get-tag-polygon-path';


// types
import type {CandlestickDatum} from '../../types/CandlestickDatum';

// type LegendKey = 'open' | 'high' | 'low' | 'close' | 'volume';
interface LegendKeys {
    date: never;
    open: never;
    high: never;
    low: never;
    close: never;
    volume: never;
}


/**
 * Class representing a crosshair on a chart
 */
export default class ChartCrosshair {
    static DEFAULT_RADIUS: number = 3;
    static DEFAULT_PRICE_INDICATOR_TRIANGLE_SIZE: number = 10;
    static dateBisector = d3.bisector<CandlestickDatum, Date>(d => d.date).left;


    private _groupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    private _xLineSelection: d3.Selection<SVGLineElement, unknown, HTMLElement, any>;
    private _yLineSelection: d3.Selection<SVGLineElement, unknown, HTMLElement, any>;
    private _priceIndicatorGroupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    private _priceIndicatorBgroundSelection: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
    private _priceIndicatorLabelSelection: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
    private _legendsSelection: d3.Selection<SVGTextElement, keyof LegendKeys, SVGGElement, any>;

    constructor(innerGroupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
        this._groupSelection = innerGroupSelection.append('g')
            .attr('id', 'crosshair')
            .style('display', 'none');


        // append crosshair circle
        this._groupSelection.append('circle')
            .attr('r', ChartCrosshair.DEFAULT_RADIUS);


        // append crosshair lines
        this._xLineSelection = this._groupSelection.append('line')
            .attr('id', 'crosshairLineX')
            .classed('crosshair-line', true)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('y2', 0);

        this._yLineSelection = this._groupSelection.append('line')
            .attr('id', 'crosshairLineY')
            .classed('crosshair-line', true)
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0);

        // crosshair line styles
        this._groupSelection.selectAll('line.crosshair-line')
            .style('fill', 'none')
            .style('stroke', '#67809f')
            .style('stroke-width', '1.5px')
            .style('stroke-dasharray', '3 3');


        // price indicator (at end of crosshair line)
        this._priceIndicatorGroupSelection = this._groupSelection.append('g')
            .attr('id', 'crosshairPrice');

        this._priceIndicatorBgroundSelection = this._priceIndicatorGroupSelection.append('polygon')
            .attr('id', 'crosshairPriceBground')
            .style('fill', 'rgba(255, 255, 255, 0.1)');

        this._priceIndicatorLabelSelection = this._priceIndicatorGroupSelection.append('text')
            .attr('id', 'crosshairPriceLabel')
            .style('fill', '#fff')
            // center vertically
            .style('dominant-baseline', 'central');

        // initialise legend
        const legendKeys: (keyof LegendKeys)[] = ['date', 'open', 'close', 'high', 'low', 'volume'];
        this._legendsSelection =
            innerGroupSelection.selectAll<SVGGElement, keyof LegendKeys>('.lineLegend')
                .data(legendKeys)
                .enter()
                .append('g')
                .attr('class', 'lineLegend')
                .attr('transform', (d, i) => `translate(0, ${i * 20})`)
                .append('text')
                .style('fill', '#fff');
    }


    private _updateLegends(currentDatum: CandlestickDatum) {
        this._legendsSelection
            .text(d => {
                switch (d) {
                    case 'date':
                        const dateStr = currentDatum.date.toLocaleDateString();
                        // const timeStr = currentDatum.date.toLocaleTimeString();
                        // return `date: ${dateStr} ${timeStr}`;
                        return `date: ${dateStr}`;
                    case 'high':
                        return `high: ${currentDatum.high.toFixed(2)}`;
                    case 'low':
                        return `low: ${currentDatum.low.toFixed(2)}`;
                    case 'open':
                        return `open: ${currentDatum.open.toFixed(2)}`;
                    case 'close':
                        return `close: ${currentDatum.close.toFixed(2)}`;
                    case 'volume':
                        return `volume: ${currentDatum.volume.toFixed(2)}`;
                }
            });
    }


    private _draw(
        xPos: number,
        xScale: d3.ScaleTime<number, number>,
        yScale: d3.ScaleLinear<number, number>,
        data: CandlestickDatum[],
        chartWidth: number,
        chartHeight: number,
        priceIndicatorTriangleSize: number = ChartCrosshair.DEFAULT_PRICE_INDICATOR_TRIANGLE_SIZE
    ) {
        // get corresponding data to x position
        const correspondingDate = xScale.invert(xPos);

        // get insertion point
        const i = ChartCrosshair.dateBisector(data, correspondingDate, 1);
        const dataEntry0 = data[i-1];
        const dataEntry1 = data[i];

        // choose whichever point is closer in time along the x axis
        const currentDataEntry = (
            (correspondingDate.getTime() - dataEntry0.date.getTime()) >
            (dataEntry1.date.getTime() - correspondingDate.getTime())
        ) ? dataEntry1 : dataEntry0;

        // position crosshair
        this._groupSelection
            .attr('transform',
                `translate(${xScale(currentDataEntry.date)}, ${yScale(currentDataEntry.close)})`);

        // update horizontal line
        this._xLineSelection
            .attr('x2', chartWidth - xScale(currentDataEntry.date));

        // update vertical line
        this._yLineSelection
            .attr('y2', chartHeight - yScale(currentDataEntry.close));

        // position price indicator
        this._priceIndicatorGroupSelection
            .attr('transform', `translate(${chartWidth - xScale(currentDataEntry.date)}, 0)`);

        // update price indicator label
        this._priceIndicatorLabelSelection
            .text(currentDataEntry.close.toFixed(2))
            .attr('transform', `translate(${priceIndicatorTriangleSize}, 0)`);

        // update price indicator background
        this._priceIndicatorBgroundSelection
            .attr('points', getTagPolygonPath(
                this._priceIndicatorLabelSelection.node().getBBox().height,
                this._priceIndicatorLabelSelection.node().getBBox().width,
                priceIndicatorTriangleSize
            ));

        // update legends
        this._updateLegends(currentDataEntry);
    }


    private _show() {
        return this._groupSelection
            .style('display', null);
    }

    private _hide() {
        return this._groupSelection
            .style('display', 'none');
    }


    // accessors

    get draw() {
        return this._draw;
    }

    get show() {
        return this._show;
    }

    get hide() {
        return this._hide;
    }
}