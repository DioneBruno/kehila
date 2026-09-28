import { defineStore } from "pinia";

export const useLayoutStore = defineStore("layoutStore", {
  state: () => ({
    layout: {} as any
  }),

  getters: {},

  actions: {
    setLayout(layout: any) {
      this.layout = layout;
    }
  },
});