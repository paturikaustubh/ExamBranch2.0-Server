export function isAnyUndefined(...variables: any[]): boolean {
  return variables.some((variable) => variable === undefined);
}

export const responses = {
  NotAllParamsGiven: {
    message: "Not all params given",
  },
  ErrorWhileDBRequest: {
    error: {
      message: "Couldn't complete the request. Check server console.",
    },
  },
  ErrorWhileReadingOrProcessing: {
    done: false,
    error: "Invalid file format.",
  },
  UnsupportedFileExt: {
    done: false,
    error: "Unsupported file ext",
  },
  PageNotFound: {
    error: "Page not found",
  },
  BadRequest: {
    error: "Bad Request",
  },
  DoneMSG: {
    done: true,
  },
};
