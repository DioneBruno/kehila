import { defineStore } from "pinia";

export const usePedidoStore = defineStore("pedidoStore", {
  state: () => ({
    evento: {
      lotes: [] as any[],
    } as any,
    pedido: {
      itens: [] as { tipoIngressoUuid: string; tipoIngressoNome: string; quantidade: number }[],
    } as any,
  }),

  getters: {},

  actions: {
    setEvento(evento: any) {
      this.evento = evento;
    },
    adicionarTipoIngresso(uuid: string, nome: string) {
      const tipoIngresso = this.evento.lotes.forEach((lote: any) => {
        return lote.tiposIngresso.find((tipo: any) => tipo.uuid === uuid);
      });
      console.log(tipoIngresso);
      this.pedido.itens.push({ tipoIngressoUuid: uuid, tipoIngressoNome: nome, quantidade: 1 });
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
  },
});
