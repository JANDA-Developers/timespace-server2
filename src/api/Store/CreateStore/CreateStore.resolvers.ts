import { Resolvers } from "../../../types/resolvers";
import {
    defaultResolver,
    privateResolver
} from "../../../utils/resolverFuncWrapper";
import { createStoreFunc } from "./CreateStoreFunc";

const resolvers : Resolvers = {
    Mutation: {
        CreateStore: defaultResolver(privateResolver(createStoreFunc))
    }
};

export default resolvers;
