import {
    OnApplicationShutdown,
    Inject,
    Module,
    Global,
    DynamicModule,
    ValueProvider,
    FactoryProvider
} from "@nestjs/common";
import { ORIENT_CONNECTION_NAME } from "./orientdb.constants";
import { ModuleRef } from "@nestjs/core";
import { OrientDBModuleOptions, } from "./interfaces/orientdb-options.interface";
import { getConnectionToken } from "./common";
import { defer } from "rxjs";
import { OrientDBClient } from "orientjs";
import { handleRetry } from "./common/orient.utils";

@Global()
@Module({})
export class OrientCoreModule implements OnApplicationShutdown {

    constructor(
        @Inject(ORIENT_CONNECTION_NAME) private readonly connectionName: string,
        private readonly moduleRef: ModuleRef,
    ) { }


    async onApplicationShutdown(signal?: string) {
        console.log(`Application shutting down ${signal}`)
        const connection = this.moduleRef.get<any>(this.connectionName);
        connection && (await connection.close());
    }

    static forRoot(
        options: OrientDBModuleOptions
    ): DynamicModule {

        const {
            retryAttempts
            , retryDelay
            , connectionName
            , connectionFactory
            , ...orientDbClientConfig
        } = options

        console.log(`${options.connectionName}`)


        const orientConnectionFactory = connectionFactory || (connection => connection)
        const orientConnectionName = getConnectionToken(connectionName);

        console.log(`Current connection name is ${orientConnectionName}`)

        const orientConnectionNameProvider: ValueProvider = {
            provide: ORIENT_CONNECTION_NAME,
            useValue: orientConnectionName
        }

        const connectionProvider: FactoryProvider = {
            provide: orientConnectionName,
            useFactory: async (): Promise<OrientDBClient> =>
                await defer(async () =>

                    orientConnectionFactory(
                        await OrientDBClient.connect(orientDbClientConfig)
                        , orientConnectionName
                    )
                )
                    .pipe(
                        handleRetry(retryAttempts, retryDelay)
                    )
                    .toPromise(),
        };

        return {
            module: OrientCoreModule,
            providers: [connectionProvider, orientConnectionNameProvider],
            exports: [connectionProvider]
        }
    }

}