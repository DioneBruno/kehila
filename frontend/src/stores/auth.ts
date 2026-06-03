import { defineStore } from "pinia";

export const useAuthStore = defineStore("authStore", {
  state: () => ({
    user: {} as any,
  }),
  actions: {
    setUser(user: any) {
      this.user = user;
    },
  },
});
