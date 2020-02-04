export const getIP = (req: any) => {
    return req.headers["x-forwarded-for"] || req.ip;
};
