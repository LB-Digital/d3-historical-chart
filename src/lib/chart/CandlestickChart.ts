import * as d3 from 'd3';


// types
import type {CandlestickDatum} from '../../types/CandlestickDatum';

interface ChartMargins {
    top: number;
    right: number;
    bottom: number;
    left: number;
}


// lib - classes
import CandlestickChartAxes from './CandlestickChartAxes';
import ClosePriceLine from './ClosePriceLine';
import SimpleMovingAverageLine from './SimpleMovingAverageLine';
import VolumeSeries from './VolumeSeries';
import ChartCrosshair from './ChartCrosshair';


export default class CandlestickChart {
    static DEFAULT_MARGINS: ChartMargins = {top: 50, right: 100, bottom: 50, left: 50};


    private readonly _containerEl: HTMLDivElement;
    private readonly _containerSelection: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    private readonly _data: CandlestickDatum[];
    private _svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    private _innerGroupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    private _axes: CandlestickChartAxes;
    private _linesGroupSelection: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    private _closePriceLine: ClosePriceLine;
    private _smaLine: SimpleMovingAverageLine;
    private _volumeSeries: VolumeSeries;
    private _crosshair: ChartCrosshair;
    private _focusBoxSelection: d3.Selection<SVGRectElement, unknown, HTMLElement, any>;

    constructor(containerSelector: string, data: CandlestickDatum[]) {
        this._containerEl = CandlestickChart._validateContainerSelector(containerSelector);
        this._containerSelection = d3.select<HTMLDivElement, unknown>(this._containerEl);

        this._data = data;

        // initialise chart
        this._init();

        // draw chart
        this._draw();
    }

    private static _validateContainerSelector(containerSelector: string): HTMLDivElement {
        const containerEl: HTMLElement = document.querySelector(containerSelector);

        // validate container
        if (containerEl.tagName !== 'DIV') {
            throw new Error('container element not a div');
        }

        if (containerEl.innerHTML) {
            throw new Error('container div not empty');
        }

        return containerEl as HTMLDivElement;
    }

    private _init(){
        // append SVG el to container
        this._svgSelection = this._containerSelection.append('svg');

        // append inner group to SVG
        this._innerGroupSelection = this._svgSelection.append('g');

        // initialise axes
        this._axes = new CandlestickChartAxes(this._innerGroupSelection);
        // initialise chart lines (close line, etc.)
        this._initChartLines();
        // initialise volume series
        this._volumeSeries = new VolumeSeries(this._innerGroupSelection);
        // initialise crosshair
        this._crosshair = new ChartCrosshair(this._innerGroupSelection);
        // initialise focus box overlay
        this._initFocusBox();
    }

    private _initChartLines() {
        // add group for lines
        this._linesGroupSelection = this._innerGroupSelection.append('g')
            .attr('id', 'chartLines');

        // add close line path
        this._closePriceLine = new ClosePriceLine(this._linesGroupSelection);
        // add SMA (simple moving average) line path
        this._smaLine = new SimpleMovingAverageLine(this._linesGroupSelection);
    }

    private _initFocusBox() {
        this._focusBoxSelection = this._innerGroupSelection.append('rect')
            .attr('id', 'overlay')
            .attr('class', 'overlay')
            .on('mouseover', () => this._crosshair.show())
            .on('mouseout', () => this._crosshair.hide())
            .style('fill', 'none')
            .style('pointer-events', 'all');
    }

    private _getDataRange() {
        const xMin = d3.min(this._data, d => d.date);
        const xMax = d3.max(this._data, d => d.date);

        const yMin = d3.min(this._data, d => d.close);
        const yMax = d3.max(this._data, d => d.close);

        if (xMin === undefined || xMax === undefined) {
            throw new Error('Invalid xMin or xMax');
        }

        if (yMin === undefined || yMax === undefined) {
            throw new Error('Invalid yMin or yMax');
        }

        return {xMin, xMax, yMin, yMax};
    }

    private _getScales(chartWidth: number, chartHeight: number) {
        // find data range
        const {xMin, xMax, yMin, yMax} = this._getDataRange();

        const xScale = d3.scaleTime().domain([xMin, xMax]).range([0, chartWidth]);
        // using xMin -> xMax domain as above includes weekends, whereas data does not, so below removes weekends...
        // const xScale = d3.scaleTime()
        //     .domain(data.map(d => d.date))
        //     .range(d3.range(0, width, width/data.length));

        const yScale = d3.scaleLinear().domain([yMin - 5, yMax]).range([chartHeight, 0]);

        return {xScale, yScale};
    }

    /**
     * Draw/Re-Draw Chart
     * @private
     * @throws - Error if data invalid
     */
    private _draw() {
        // update chart size

        // get container dimensions
        const {width: containerWidth, height: containerHeight} = this._containerEl.getBoundingClientRect();

        // update SVG element width & height
        this._svgSelection
            .attr('width', containerWidth)
            .attr('height', containerHeight);

        // get chart width and height
        const width = containerWidth - CandlestickChart.DEFAULT_MARGINS.left - CandlestickChart.DEFAULT_MARGINS.right;
        const height = containerHeight - CandlestickChart.DEFAULT_MARGINS.top - CandlestickChart.DEFAULT_MARGINS.bottom;

        // position inner group to respect margins
        this._innerGroupSelection
            .attr('transform', `translate(${CandlestickChart.DEFAULT_MARGINS.left}, ${CandlestickChart.DEFAULT_MARGINS.top})`);

        // get updated scales
        const {xScale, yScale} = this._getScales(width, height);

        // draw axes
        this._axes.draw(height, width, xScale, yScale);

        // draw close price line
        this._closePriceLine.draw(xScale, yScale, this._data);
        // draw SMA line
        this._smaLine.draw(xScale, yScale, this._data);

        // draw volume series
        this._volumeSeries.draw(xScale, this._data, height);

        // update focus overlay size
        this._focusBoxSelection
            .attr('width', width)
            .attr('height', height);

        // update focus overlay event listener
        this._focusBoxSelection
            .on('mousemove', (ev) => {
                const mouseXPos = d3.pointer(ev)[0];
                this._crosshair.draw(mouseXPos, xScale, yScale, this._data, width, height);
            });
    }


    get draw() {
        return this._draw;
    }
}