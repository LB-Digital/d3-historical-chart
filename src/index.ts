// // element selectors
// const chartEl = document.getElementById('chart');


// lib
import getFinnhubCandlestickData from './lib/chart/get-finnhub-candlestick-data';
import CandlestickChart from './lib/chart/CandlestickChart';


// types
import {CandlestickDatum} from './types/CandlestickDatum';


// main
(async () => {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setMonth(now.getMonth() - 11);

    let candlestickData: CandlestickDatum[];
    try {
        candlestickData = await getFinnhubCandlestickData('AAPL', 'D', fromDate, now);
    } catch (err) {
        console.error(err);
        return;
    }


    const chart = new CandlestickChart('#chart', candlestickData);
    window.addEventListener('resize', () => chart.draw());
})();