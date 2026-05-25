import moment from "moment-timezone";

type UnitOfTime =
  | "year"
  | "years"
  | "y"
  | "month"
  | "months"
  | "M"
  | "week"
  | "weeks"
  | "w"
  | "day"
  | "days"
  | "d"
  | "hour"
  | "hours"
  | "h"
  | "minute"
  | "minutes"
  | "m"
  | "second"
  | "seconds"
  | "s"
  | "millisecond"
  | "milliseconds"
  | "ms";

export class ApiDate {
  constructor() {}

  static now(format = "YYYY-MM-DD HH:mm:ss"): string {
    // moment.tz.setDefault("America/Cuiaba");
    return moment().format(format);
  }

  static nowAsDate(): Date {
    return moment().toDate();
  }

  static nowTime() {
    return moment().toDate().getTime();
  }

  static timeToDate(time: number) {
    return moment(time).format();
  }

  static timeToDateObject(time: number): Date {
    return moment(time).toDate();
  }

  static format(date: string, format = "YYYY-MM-DD HH:mm:ss", formatAtual = "YYYY-MM-DD HH:mm:ss") {
    if (!date) return null;
    const response = moment(date, formatAtual).format(format);
    return response;
  }

  static addDay(date: string, dayAmount = 1, format = "YYYY-MM-DD HH:mm:ss") {
    const newDate = moment(date, format).add(dayAmount, "days");
    return newDate.format(format);
  }

  static subtractDay(date: string, dayAmount = 1, format = "YYYY-MM-DD HH:mm:ss") {
    const newDate = moment(date, format).subtract(dayAmount, "days");
    return newDate.format(format);
  }

  static diff(dateBegin: string, dateEnd: string, unidadeMedita: UnitOfTime = "days") {
    const data1 = moment(dateBegin);
    const data2 = moment(dateEnd);
    return data2.diff(data1, unidadeMedita); // Retorna 2
  }

  static parseToDate(dateString: string): Date {
    if (!dateString) return moment().toDate();
    return moment(dateString).toDate();
  }

  static msToHumanReadable(ms: number): string {
    if (ms < 0) ms = 0;

    const duration = moment.duration(ms);

    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds} ${seconds === 1 ? "segundo" : "segundos"}`);
    }

    return parts.join(" e ");
  }
}
