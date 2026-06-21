import { useQuasar } from "quasar";

export class MessageConfirmationService {
  private $q = useQuasar();
  constructor() {}
  execute(message?: string): Promise<boolean> {
    return new Promise((resolve, rege) => {
      this.$q
        .dialog({
          html: true,
          title: "Confirmação",
          message: `${message ?? "Confirma essa ação?"}`,
          ok: {
            flat: true,
            color: "positive",
            label: "Sim",
          },
          cancel: {
            flat: true,
            color: "negative",
            label: "Não",
          },
          persistent: true,
        })
        .onOk((text) => {
          resolve(true);
        })
        .onCancel(() => {
          resolve(false);
        })
        .onDismiss(() => {
          resolve(false);
        });
    });
  }
}

export class MessageConfirmationDialogService {
  private $q = useQuasar();
  constructor() {}
  execute(confirmation?: string, title?: string, description?: string) {
    const message = confirmation ?? "remover";
    return new Promise((resolve, rege) => {
      this.$q
        .dialog({
          html: true,
          title: `${title ? title : "Confirmação para exclusão"}`,
          message: `Degite <b>${message ?? "remover"}</b> para confirmar ${description ? description : ""}`,
          prompt: {
            model: "",
            placeholder: message,
            type: "text", // optional
          },
          cancel: true,
          persistent: true,
        })
        .onOk((text) => {
          if (confirmation && confirmation == text) resolve(true);
          if (!confirmation && text == "remover") resolve(true);
          else resolve(false);
        })
        .onCancel(() => {
          resolve(false);
        })
        .onDismiss(() => {
          resolve(false);
        });
    });
  }
}
