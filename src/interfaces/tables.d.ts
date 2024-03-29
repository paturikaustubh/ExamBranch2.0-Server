interface Icbtsubjects {
  subCode: string;
  subName: string;
  branch: string;
  acYear?: number | null;
  sem?: number | null;
  regYear?: number | null;
}

interface Iprintcbt {
  rollNo: string;
  subCode: string;
  subName?: string | null;
  acYear?: number | null;
  sem?: number | null;
  regDate?: string | null;
  branch?: string | null;
  user?: string | null;
}

type Ipaidcbt = Iprintcbt;

interface Iprintsupple {
  rollNo: string;
  subCode: string;
  subName?: string | null;
  acYear?: number | null;
  sem?: number | null;
  regDate?: string | null;
  user?: string | null;
}

type Ipaidsupple = Iprintsupple;

interface Iprintreval {
  rollNo: string;
  subCode: string;
  subName?: string | null;
  acYear?: number | null;
  sem?: number | null;
  regDate?: string | null;
  stat?: string | null;
  user?: string | null;
}

type Ipaidreval = Iprintreval;

interface Istudentinfo {
  rollNo: string;
  subCode: string;
  subName?: string | null;
  grade?: string | null;
  acYear?: number | null;
  sem?: number | null;
  exYear?: number | null;
  exMonth?: number | null;
  gradePoint?: number | null;
  credits?: number | null;
  orCredits?: number | null;
  json?: any | null;
}
