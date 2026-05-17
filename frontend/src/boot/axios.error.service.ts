
import { driver } from "driver.js";

export default class AxiosErrorService {
  static execute(error: any) {
    const driverObj = driver({
      showProgress: true,
      prevBtnText: "Voltar",
      nextBtnText: "Próximo",
      doneBtnText: "OK",
      steps: [],
    });
    const steps = this.motaSteps(error);
    driverObj.setSteps(steps);
    driverObj.drive();
  }

  private static motaSteps(error: any) {
    const steps = [];
    for (const item of error.data) {
      steps.push({
        element: item.element,
        popover: {
          title: item.title,
          description: item.description,
        },
      });
    }
    return steps;
  }
}
