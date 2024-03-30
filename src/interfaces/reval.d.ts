export interface Details {
    [semCode: string]: {
        subCodes: string[];
        subNames: string[];
    };
}

export interface SubjectDetails {
    subCodes: string[];
    subNames: string[];
}

export interface RevalRow {
    subCode: string;
    subName:string;
}

export interface RevalTable {
    rollNo: string;
    subCode: string;
    subName: string;
    acYear: string;
    sem: string;
    regDate: string;
    stat: string;
    user: string;
    grandTotal: number;
}


