export declare class ackTask {
    data: any;
    constructor($scope: any);
    getLogFilePath(): any;
    getLogFileFolder(): import("ack-path").Path;
    getLogFile(): import("ack-path/js/file").File;
    getRequirePromiseByPath(path: any): Promise<any>;
    deleteLogPath(): Promise<any>;
    logResult(result: string): Promise<{}>;
    pathEveryMil(path: any, ms: any, each: any): {
        cancel: () => void;
    };
    pathOnDate(path: any, date: any): any;
    pathAtTimeOnWeekDays(path: any, hour: any, minute: any, each: any, success: any, fail: any): this;
}
export declare function method($scope: any): ackTask;
