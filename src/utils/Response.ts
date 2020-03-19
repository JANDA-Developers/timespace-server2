import { Err } from "./Error";

export class Response<T = void> {
    ok: boolean;
    errors: Err[];
    data: T | null;
}
