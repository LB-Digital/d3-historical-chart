import * as d3 from 'd3';
import * as t from 'io-ts';


// lib
import decodeToPromise from '../decode-to-promise';


// types
import type {ChartResolution} from '../../types/ChartResolution';
import {CandlestickDatum} from '../../types/CandlestickDatum';


// type validators
const FinnhubResponseOkV = t.type({
    // Status of the response.
    s: t.literal('ok'),

    // List of open prices for returned candles.
    o: t.array(t.number),
    // List of high prices for returned candles.
    h: t.array(t.number),
    // List of low prices for returned candles.
    l: t.array(t.number),
    // List of close prices for returned candles.
    c: t.array(t.number),
    // List of volume data for returned candles.
    v: t.array(t.number),
    // List of timestamp for returned candles.
    t: t.array(t.number),
}, 'FinnhubResponseOk');
type FinnhubResponseOk = t.TypeOf<typeof FinnhubResponseOkV>;

const FinnhubResponseNoDataV = t.type({
    // Status of the response.
    s: t.literal('no_data')
}, 'FinnhubResponseNoData');

const FinnhubResponseV = t.union([FinnhubResponseOkV, FinnhubResponseNoDataV], 'FinnhubResponse');
type FinnhubResponse = t.TypeOf<typeof FinnhubResponseV>;


/**
 * Get Candlestick data from Finnhub
 * https://finnhub.io/docs/api/stock-candles
 *
 * @param symbol - Symbol.
 * @param resolution - Supported resolution includes 1, 5, 15, 30, 60, D, W, M . Some timeframes might not
 * be available depending on the exchange.
 * @param from - Interval start date
 * @param to - Interval end date
 */
const getFinnhubCandlestickData = async (
    symbol: string,
    resolution: ChartResolution,
    from: Date,
    to: Date
): Promise<CandlestickDatum[]> => {
    const fromTimestamp = Math.floor(from.getTime() / 1000);
    const toTimestamp = Math.floor(to.getTime() / 1000);


    const reqUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${fromTimestamp}&to=${toTimestamp}&token=${process.env.FINNHUB_API_KEY}`;

    // request data from API
    const jsonData = await d3.json(reqUrl);

    // validate raw candlestick data
    let finnhubResponse: FinnhubResponse;
    try {
        finnhubResponse = await decodeToPromise(FinnhubResponseV, jsonData);
    } catch (err) {
        console.error('failed to decode candle stick data: ', err);
        throw new Error('malformed candlestick data response');
    }

    // check returned status
    if (finnhubResponse.s === 'no_data') {
        throw new Error('no candlestick data');
    }


    // data validated and status ok, parse and return
    return ((finnhubResponse: FinnhubResponseOk) =>
        finnhubResponse.t.map<CandlestickDatum>((timestamp, i) => ({
            date: new Date(timestamp * 1000),
            open: finnhubResponse.o[i],
            high: finnhubResponse.h[i],
            low: finnhubResponse.l[i],
            close: finnhubResponse.c[i],
            volume: finnhubResponse.v[i]
        }))
    )(finnhubResponse);
}

export default getFinnhubCandlestickData;