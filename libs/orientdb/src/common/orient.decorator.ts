import { Inject } from "@nestjs/common";

export const InjectConnection = (name?:string) => Inject(name) 