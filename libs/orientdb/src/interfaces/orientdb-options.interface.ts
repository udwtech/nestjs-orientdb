import { OrientDBClientConfig, OrientDBClient } from 'orientjs'
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';


export interface OrientDBModuleOptions
    extends OrientDBClientConfig
    , Record<string, any> {

    retryDelay?: number;
    retryAttempt?: number;
    connectionName?: string;
    connectionFactory?: (connection: OrientDBClient, name: string) => OrientDBClient;

}

export interface OrientOptionsFactory {
    createOrientOptions():
        | Promise<OrientDBModuleOptions>
        | OrientDBModuleOptions;
}

export interface OrientModuleAsyncOptions
    extends Pick<ModuleMetadata, 'imports'> {
    connectionName?: string;
    useExisting?: Type<OrientOptionsFactory>;
    useClass?: Type<OrientOptionsFactory>;
    useFactory?: (
        ...args: any[]
    ) => Promise<OrientDBModuleOptions> | OrientDBModuleOptions;
    inject?: any[];
}


