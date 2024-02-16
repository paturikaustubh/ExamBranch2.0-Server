import dayjs from "dayjs";

type TLogOptions = "info" | "warn" | "error" | "fatal"

export function log(ltype:TLogOptions='info', ...lmessage: any[]) {
    var dt = dayjs().format("D-MMM-YYYY hh:mm:ss A");
    console.log(`[${dt}] [${ltype}] `, ...lmessage);
}
