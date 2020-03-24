import { Module, DynamicModule, Options } from '@nestjs/common';
import {
  OrientDBModuleOptions,
  OrientModuleAsyncOptions,
} from './interfaces/orientdb-options.interface';
import { OrientCoreModule } from './orientdb-core.module';

@Module({})
export class OrientdbModule {
  static forRoot(options: OrientDBModuleOptions): DynamicModule {
    return {
      module: OrientdbModule,
      imports: [OrientCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: OrientModuleAsyncOptions): DynamicModule {
    return {
      module: OrientdbModule,
      imports: [OrientCoreModule.forRootAsync(options)],
    };
  }
}
