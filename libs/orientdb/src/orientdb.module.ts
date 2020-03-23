import { Module, DynamicModule, Options } from '@nestjs/common';
import { OrientDBModuleOptions } from './interfaces/orientdb-options.interface';
import { OrientCoreModule } from './orientdb-core.module';

@Module({})
export class OrientdbModule {

  static forRoot(
    options: OrientDBModuleOptions
  ): DynamicModule {
    return {
      module: OrientdbModule,
      imports: [OrientCoreModule.forRoot(options)]
    };
  }
}
