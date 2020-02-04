export const getIP = (req: any) => {
    return (
        req.headers["x-forwarded-for"] ||
        req.headers["X-Forwarded-For"] ||
        req.ip
    );
};
