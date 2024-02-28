export interface SubjectDetails {
    subCodes: string[];
    subNames: string[];
}
export interface Details {
    [Key: string]: SubjectDetails;
}

export interface PrintSupply {
    rollNo: string,
    subCode: string,
    subName: string
    // TODO: fill all the columns for completeness
}

export interface StudentInfo {
    rollNo: string,
    subCode: string,
    subName: string
    // TODO: fill all the columns for completeness
}