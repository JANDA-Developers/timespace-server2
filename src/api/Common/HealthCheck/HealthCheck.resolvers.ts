import { Resolvers } from "../../../types/resolvers";
import { HealthCheckResponse } from "../../../types/graph";
const resolvers: Resolvers = {
    Query: {
        HealthCheck: async (): Promise<HealthCheckResponse> => {
            return {
                ok: true,
                error: null
            };
        }
    }
};
export default resolvers;
