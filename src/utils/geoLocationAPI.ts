import Axios from "axios";

/* eslint-disable @typescript-eslint/camelcase */
const GEO_LOCATION_END_POINT = `${process.env.IPGEOLOCATION_END_POINT}`;

type GeoLocationOutput = {
    ip?: string;
    continent_code?: string;
    continent_name?: string;
    country_code2?: string;
    country_code3?: string;
    country_name?: string;
    country_capital?: string;
    state_prov?: string;
    district?: string;
    city?: string;
    zipcode?: string;
    latitude?: string;
    longitude?: string;
    is_eu?: boolean;
    calling_code?: string;
    country_tld?: string;
    languages?: string;
    country_flag?: string;
    geoname_id?: string;
    isp?: string;
    connection_type?: string;
    organization?: string;
    currency?: {
        code: string;
        name: string;
        symbol: string;
    };
    time_zone?: {
        name: string;
        offset: number;
        current_time: string;
        current_time_unix: number;
        is_dst: boolean;
        dst_savings: number;
    };
};

export const getGeoInfoByIP = async (
    ipAddress: string
): Promise<GeoLocationOutput> => {
    const edgeUrlWithAPIkey = `${GEO_LOCATION_END_POINT}${process.env.IPGEOLOCATION_END_POINT_EDGE_IPGEO}?apiKey=${process.env.IPGEOLOCATION_API_KEY}&ip=${ipAddress}`;
    const {
        data
    }: {
        data: GeoLocationOutput;
    } = await Axios.get(edgeUrlWithAPIkey);
    return data;
};
