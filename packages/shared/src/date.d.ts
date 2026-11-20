export declare const APP_TIMEZONE = "Asia/Kolkata";
export declare function formatDateIst(input: Date | string | number): string;
export declare function formatDateTimeIst(input: Date | string | number): string;
export declare function startOfDayIst(input: Date | string): Date;
export declare function endOfDayIst(input: Date | string): Date;
export declare function monthRangeIst(year: number, month: number): {
    start: Date;
    end: Date;
};
export declare function yearRangeIst(year: number): {
    start: Date;
    end: Date;
};
export declare function getIstYearMonth(input?: Date | string): {
    year: number;
    month: number;
};
export declare function monthLabel(month: number): string;
