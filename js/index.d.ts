export interface ackType {
    error?: any;
    number?: any;
    string?: any;
    binary?: any;
    base64?: any;
    method?: any;
    array?: any;
    object?: any;
    queryObject?: any;
    week?: any;
    month?: any;
    year?: any;
    date?: any;
    time?: any;
    function?: any;
    promise?: any;
}
export interface lazyack extends ackType {
    crypto?: any;
    jwt?: any;
    file?: any;
    path?: any;
    etag?: any;
    reqres?: any;
    templating?: any;
    scheduler?: any;
}
export declare const ackX: lazyack;
