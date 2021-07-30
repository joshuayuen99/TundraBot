import Cookies from "cookies";

declare global {
    namespace Express {
        interface Response {
            cookies: Cookies;
        }
    }
}