export declare class templating {
    options: {
        filePath: string;
    };
    constructor(filePathOrOptions: any);
    compile(): any;
    render(locals: any): any;
}
export declare function method(filePathOrOptions: any): templating;
