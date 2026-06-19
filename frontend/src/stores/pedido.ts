import { defineStore } from "pinia";

export const usePedidoStore = defineStore("pedidoStore", {
  state: () => ({
    evento: {
      lotes: [] as any[],
    } as any,
    pedido: {
      uuid: "",
      tab: "ingressos",
      etapa: 1,
      itens: [] as {
        tipoIngressoUuid: string;
        tipoIngressoNome: string;
        quantidade: number;
        gerarQuantidadeIngressos: number;
      }[],
      ingressos: [] as any[],
    } as any,
  }),

  getters: {},

  actions: {
    setEvento(evento: any) {
      this.evento = evento;
    },
    adicionarTipoIngresso(uuid: string, nome: string) {
      let tipoIngresso: any;
      for (const lote of this.evento.lotes) {
        const tipo = lote.tiposIngresso?.find((tipo: any) => tipo.uuid === uuid);
        if (tipo) {
          tipoIngresso = tipo;
          break;
        }
      }
      this.pedido.itens.push({
        tipoIngressoUuid: uuid,
        tipoIngressoNome: nome,
        quantidade: 1,
        gerarQuantidadeIngressos: tipoIngresso?.gerarQuantidadeIngressos ?? 1,
      });
    },
    removerTipoIngresso(uuid: string) {
      this.pedido.itens = this.pedido.itens.filter((item: any) => item.tipoIngressoUuid !== uuid);
    },
    incrementarTipoIngresso(uuid: string) {
      const item = this.pedido.itens.find((item: any) => item.tipoIngressoUuid === uuid);
      if (item) {
        item.quantidade++;
      }
    },
    decrementarTipoIngresso(uuid: string) {
      const item = this.pedido.itens.find((item: any) => item.tipoIngressoUuid === uuid);
      if (item) {
        item.quantidade--;
        if (item.quantidade === 0) {
          this.removerTipoIngresso(uuid);
        }
      }
    },
    setPedido(pedido: any) {
      this.$patch((state) => {
        Object.assign(state.pedido, { ...pedido, etapa: pedido.cobrancas?.length ? 6 : 4 });
      });
    },
    resetPedido() {
      this.$patch((state) => {
        state.pedido = { uuid: "", etapa: 1, itens: [], ingressos: [] };
      });
    },
  },
});
