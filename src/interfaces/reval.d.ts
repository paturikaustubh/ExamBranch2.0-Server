export interface Details {
    [semCode: string]: {
        subCodes: string[];
        subNames: string[];
    };
}


export interface RevalRow {
    subCode: string;
    subName:string;
}