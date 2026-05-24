import moment from "moment-timezone";
require("dotenv").config();

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

moment.tz.setDefault(process.env.TZ);
export class ApiDate {
  constructor() {}

  static now(format: string = "YYYY-MM-DD HH:mm:ss") {
    return moment().format(format);
  }

  /**
   * Retorna a data/hora atual como objeto Date respeitando o timezone configurado
   * @returns Date object com timezone aplicado
   */
  static nowAsDate(): Date {
    return moment().toDate();
  }

  static nowTime() {
    return moment().toDate().getTime();
  }

  static timeToDate(time: number) {
    return moment(time).format();
  }

  /**
   * Converte timestamp para objeto Date respeitando o timezone
   * @param time - timestamp em milliseconds
   * @returns Date object
   */
  static timeToDateObject(time: number): Date {
    return moment(time).toDate();
  }

  static format(date: string, format: string = "YYYY-MM-DD HH:mm:ss") {
    if (!date) return null;
    const response = moment(date).format(format);
    return response;
  }

  static isPastOrToday(date: string, format: string = "YYYY-MM-DD") {
    if (!date) return false;

    const today = moment().startOf("day");
    const inputDate = moment(date, format).startOf("day");

    return inputDate.isSameOrBefore(today);
  }

  static addDay(date: string, dayAmount: number = 1, format: string = "YYYY-MM-DD HH:mm:ss") {
    const newDate = moment(date, format).add(dayAmount, "days");
    return newDate.format(format);
  }

  static subtractHour(date: string, hourAmount: number = 1, format: string = "YYYY-MM-DD HH:mm:ss") {
    const newDate = moment(date, format).subtract(hourAmount, "hours");
    return newDate.format(format);
  }

  static diff(dateBegin: string, dateEnd: string, unidadeMedita: UnitOfTime = "days") {
    const data1 = moment(dateBegin);
    const data2 = moment(dateEnd);
    return data2.diff(data1, unidadeMedita); // Retorna 2
  }

  static nextBusinessDay(date: string, addDay: number = 0, holidays: { dia: string; mes: string }[] = []) {
    let addedBusinessDays = 0;
    let totalDays = 0;

    const momentDate = moment(date);

    // Calcula o total de dias necessários para ter X dias úteis
    while (addedBusinessDays < addDay) {
      totalDays++;
      momentDate.add(1, "days");

      if (ApiDate.isBusinessDay(momentDate.format("YYYY-MM-DD"), holidays)) {
        addedBusinessDays++;
      }
    }

    return ApiDate.addDay(date, totalDays, "YYYY-MM-DD HH:mm:ss");
  }

  static isBusinessDay(date: string, holidays: { dia: string; mes: string }[]) {
    const momentDate = moment(date);
    const dayOfWeek = momentDate.day(); // 0 = domingo, 6 = sábado
    // Verifica se não é fim de semana e não é feriado
    return dayOfWeek !== 0 && dayOfWeek !== 6 && !ApiDate.isHoliday(momentDate, holidays);
  }

  /**
   * Converte uma data/string para objeto Date respeitando o timezone
   * @param date - string de data ou timestamp
   * @param inputFormat - formato da data de entrada (opcional)
   * @returns Date object com timezone aplicado
   */
  static parseToDate(date: string | number, inputFormat?: string): Date {
    if (inputFormat) {
      return moment(date, inputFormat).toDate();
    }
    return moment(date).toDate();
  }

  static isHoliday(date: moment.Moment, holidays: { dia: string; mes: string }[]) {
    const response = holidays.some((holiday) => {
      const day = date.date();
      const month = date.month() + 1; // Em moment, mês começa em 0
      return Number(holiday.dia) === day && Number(holiday.mes) === month;
    });
    return response;
  }

  static isValid(dateString: string, formats?: string[]) {
    if (!formats) formats = ["YYYY-MM-DD", "DD/MM/YYYY", "D/M/YYYY", "MM/DD/YY", "M/D/YY", "DD/MM/YY"];
    return moment(dateString, formats, true).isValid();
  }
}
