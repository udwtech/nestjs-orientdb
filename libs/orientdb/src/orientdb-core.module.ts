import {
    OnApplicationShutdown,
    Inject,
    Module,
    Global,
    DynamicModule,
    ValueProvider,
    FactoryProvider,
    Provider,
    Type,
} from '@nestjs/common';
import {
    ORIENT_CONNECTION_NAME,
    ORIENT_MODULE_OPTIONS,
} from './orientdb.constants';
import { ModuleRef } from '@nestjs/core';
import {
    OrientDBModuleOptions,
    OrientModuleAsyncOptions,
    OrientOptionsFactory,
} from './interfaces/orientdb-options.interface';
import { getConnectionToken } from './common';
import { defer } from 'rxjs';
import { OrientDBClient } from 'orientjs';
import { handleRetry } from './common/orient.utils';

@Global()
@Module({})
export class OrientCoreModule implements OnApplicationShutdown {
    constructor(
        @Inject(ORIENT_CONNECTION_NAME) private readonly connectionName: string,
        private readonly moduleRef: ModuleRef,
    ) { }

    async onApplicationShutdown(signal?: string) {
        console.log(`Application shutting down ${signal}`);
        const connection = this.moduleRef.get<any>(this.connectionName);
        connection && (await connection.close());
    }

    /**
     * Default Connection Token ORIENTDBCONNECTIONTOKEN
     * @param options
     * @returns orientdb client
     */
    static forRoot(options: OrientDBModuleOptions): DynamicModule {
        const {
            retryAttempts,
            retryDelay,
            connectionName,
            connectionFactory,
            ...orientDbClientConfig
        } = options;

        const orientConnectionFactory =
            connectionFactory || (connection => connection);
        const orientConnectionName = getConnectionToken(connectionName);

        console.log(`Current connection name is ${orientConnectionName}`);

        const orientConnectionNameProvider: ValueProvider = {
            provide: ORIENT_CONNECTION_NAME,
            useValue: orientConnectionName,
        };

        const connectionProvider: FactoryProvider = {
            provide: orientConnectionName,
            useFactory: async (): Promise<OrientDBClient> =>
                await defer(async () =>
                    orientConnectionFactory(
                        await OrientDBClient.connect(orientDbClientConfig),
                        orientConnectionName,
                    ),
                )
                    .pipe(handleRetry(retryAttempts, retryDelay))
                    .toPromise(),
        };

        return {
            module: OrientCoreModule,
            providers: [connectionProvider, orientConnectionNameProvider],
            exports: [connectionProvider],
        };
    }

    static forRootAsync(options: OrientModuleAsyncOptions): DynamicModule {
        const orientConnectionName = getConnectionToken(options.connectionName);

        const orientConnectionNameProvider: ValueProvider = {
            provide: ORIENT_CONNECTION_NAME,
            useValue: orientConnectionName,
        };

        const connectionProvider: FactoryProvider = {
            provide: orientConnectionName,
            useFactory: async (
                orientModuleOptions: OrientDBModuleOptions,
            ): Promise<OrientDBClient> => {
                const {
                    retryAttempts,
                    retryDelay,
                    connectionName,
                    connectionFactory,
                    ...orientDbClientConfig
                } = orientModuleOptions;

                const orientConnectionFactory =
                    connectionFactory || (connection => connection);

                return await defer(async () =>
                    orientConnectionFactory(
                        await OrientDBClient.connect(orientDbClientConfig),
                        orientConnectionName,
                    ),
                )
                    .pipe(handleRetry(retryAttempts, retryDelay))
                    .toPromise();
            },
            inject: [ORIENT_MODULE_OPTIONS],
        };
        const asyncProviders = this.createAsyncProviders(options);

        return {
            module: OrientCoreModule,
            imports: options.imports,
            providers: [
                ...asyncProviders,
                connectionProvider,
                orientConnectionNameProvider,
            ],
            exports: [connectionProvider],
        };
    }

    private static createAsyncProviders(
        options: OrientModuleAsyncOptions,
    ): Provider[] {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }

        const useClass = options.useClass as Type<OrientOptionsFactory>;

        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: useClass,
                useClass,
            },
        ];
    }

    private static createAsyncOptionsProvider(
        options: OrientModuleAsyncOptions,
    ): Provider {
        if (options.useFactory) {
            return {
                provide: ORIENT_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }

        const inject = [
            (options.useClass || options.useExisting) as Type<OrientOptionsFactory>,
        ];

        return {
            provide: ORIENT_MODULE_OPTIONS,
            useFactory: async (optionsFactory: OrientOptionsFactory) =>
                await optionsFactory.createOrientOptions(),
            inject,
        };
    }
}
