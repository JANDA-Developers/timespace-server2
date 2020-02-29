import { GraphQLBoolean, GraphQLString } from "graphql";

const resolvers = {
    PageInfo: {
        __type: GraphQLString,
        startCursor: { __type: GraphQLString },
        endCursor: { __type: GraphQLString },
        hasNextPage: { __type: GraphQLBoolean }
    }
};

export default resolvers;
