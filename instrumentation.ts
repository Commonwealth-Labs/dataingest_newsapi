/*instrumentation.ts*/
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ns, version } from './config.js';
import { Tracer, Span } from '@opentelemetry/api';

export function withTracer(tracer: Tracer) {

    return async function forSpan<T>(spanName: string, strategy: (span: Span) => Promise<T>) {

        return await tracer.startActiveSpan(spanName, async (span) => {

            try {

                return await strategy(span);

            } catch (err: any) {

                span.recordException(err);
                throw err;

            } finally {

                span.end();

            }

        });

    };

}

export { trace } from '@opentelemetry/api';

const sdk = new NodeSDK({
    resource: new Resource({
        [ATTR_SERVICE_NAME]: ns,
        [ATTR_SERVICE_VERSION]: version
    }),
    traceExporter: new ConsoleSpanExporter(),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
    }),
    instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

export { sdk };
