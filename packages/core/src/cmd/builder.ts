/* eslint-disable */
import {ISteamService, Session} from "@/interface";
import {Logger} from "@/interface/logger";
import {ImgRender} from "@/render";
 
export type CmdExecutor<OPT extends object = {}> = (
  render:ImgRender,
  steamService:ISteamService,
  logger:Logger,
  session:Session,
  options:OPT,
  input:string,
  rawInput:string
) => Promise<void>

interface CmdOption {
  type: |'boolean'|'number'|'string'|'null'|'undefined',
  name: string,
  short?: string,
  description?: string,
  required?: boolean
}

export interface Command<T extends any = any> {
  name: string
  description: string
  callback:CmdExecutor
  children: Command[]
}
 
type Extend<BASE extends {}, N extends string, D> = {
  [P in N | keyof BASE]?: (P extends keyof BASE ? BASE[P] : unknown) & (P extends N ? D : unknown);
}

type ExtractType<T extends string> = T extends 'string' ? string :
                                     T extends 'boolean' ? boolean :
                                     T extends 'number' ? number : any

type Nullable<T> = T | null

type ExtractNullSafeType<T extends string> = T extends `${infer Type}?` ? Nullable<ExtractType<Type>> : ExtractType<T>
// paramName:typename?
// eg: online:boolean?
type OptionType<T extends string> = T extends `${infer L}:${infer R}` ? ExtractNullSafeType<R>: unknown

export class CommandBuilder<OPT extends {} = {}> {

  private name: string
  private description: string
  private cmdOption: CmdOption[] = []
  addOption<N extends string,D extends string>(name: N, description: D) {
    this.cmdOption.push({
       
      name: name, 
       
      description: description,  
       
      type:'string'
    })
    return this as CommandBuilder<Extend<OPT,N,OptionType<D>>>
  }
  setName<T extends string> (name: T) {
    this.name = name
    return this;
  }
  setDescription (description: string) {
    this.description = description
    return this;
  }
  setExecutor(executor: CmdExecutor<OPT>) {
    return {
      name: this.name,
      description:this.description,
      callback: executor,
      children: [],
    }
  }
}
