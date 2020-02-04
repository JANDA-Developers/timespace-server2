export type Resolver = (parent: any, args: any, context: any, info: any) => any;

export interface Resolvers {
    [key: string]: {
        [key: string]: Resolver;
    };
}

export type ResolverFunction = (
    { parent: any, args: any, context: any, info: any },
    stack: any[]
) => any;
