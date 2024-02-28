export function isAnyUndefined(...variables: any[]): boolean {
    return variables.some(variable => variable === undefined);
}

export const responses = {
    NotAllParamsGiven:{
        done: false,
        error: "Not all params given. Ask server admin for help"
    },
    ErrorWhileDBRequest:{
        error: "Error occured while db request. Check server logs for more information"
    },
    ErrorWhileDBRequestWithDone:{
        done: false,
        error: "Error occured while db request. Check server logs for more information"
    },
    ErrorWhileDBRequestWithDeleted:{
        deleted: false,
        error: "Error occured while db request. Check server logs for more information"
    },
    ErrorWhileDBRequestWithUpdated:{
        updated: false,
        error: "Error occured while db request. Check server logs for more information"
    },
    ErrorWhileReadingOrProcessing:{ 
        done: false, 
        error: "Error reading or processing file from the file check Server log for more info" 
    },
    UnsupportedFileExt:{
        error: "Unsupported file ext"
    },
    PageNotFound:{
        error:"Page not found"
    },
    BadRequest:{
        error: "Bad Request"
    },
    DoneMSG:{
        done: true
    }
}