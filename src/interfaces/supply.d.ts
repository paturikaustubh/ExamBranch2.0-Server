export interface SubjectDetails {
  subCodes: string[];
  subNames: string[];
}
export interface Details {
  [Key: string]: SubjectDetails;
}

export interface PrintSupple {
  rollNo: string;
  subCode: string;
  subName: string;
  // TODO: fill all the columns for completeness
}

export interface StudentInfo {
  rollNo: string;
  subCode: string;
  subName: string;
  // TODO: fill all the columns for completeness
}

export interface ExamSearchSubjectsProps {
  A: {
    subCodes: string[];
    subNames: string[];
  };
  B: {
    subCodes: string[];
    subNames: string[];
  };
  C: {
    subCodes: string[];
    subNames: string[];
  };
  D: {
    subCodes: string[];
    subNames: string[];
  };
  E: {
    subCodes: string[];
    subNames: string[];
  };
  F: {
    subCodes: string[];
    subNames: string[];
  };
  G: {
    subCodes: string[];
    subNames: string[];
  };
  H: {
    subCodes: string[];
    subNames: string[];
  };
}

export interface ExamSemProps {
  subCodes: string[];
  subNames: string[];
}
