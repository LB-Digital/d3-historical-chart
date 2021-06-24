import * as t from 'io-ts';
import {pipe} from 'fp-ts/function';
import {fold} from 'fp-ts/Either';
import reporter from 'io-ts-reporters';

const decodeToPromise = <T, O, I>(validator: t.Type<T, O, I>, input: I): Promise<T> => {
    const result = validator.decode(input);

    return new Promise(((resolve, reject) =>
            pipe(result, fold((errors) => {
                const messages = reporter.report(result);
                reject(new Error(messages.join('\n')));
            }, resolve))
    ));
}

export default decodeToPromise;