<template>
  <q-form ref="formRef" greedy>
    <div class="row q-col-gutter-xs">
      <div class="col-12 q-pb-md text-grey-8">
        <span>Dados do usuário principal</span>
      </div>
      <div class="col-12 col-sm-4">
        <q-input
          outlined
          dense
          unmasked-value
          stack-label
          v-model="user.cpf"
          label="CPF *"
          mask="###.###.###-##"
          :rules="[(v) => !!v || 'Obrigatório']"
          lazy-rules
        />
      </div>
      <div class="col-12 col-sm-8">
        <q-input
          outlined
          dense
          stack-label
          v-model="user.name"
          label="Nome completo *"
          :rules="[(v) => !!v || 'Obrigatório']"
          lazy-rules
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          outlined
          dense
          stack-label
          v-model="user.email"
          label="E-mail *"
          type="email"
          :rules="[(v) => !!v || 'Obrigatório']"
          lazy-rules
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          unmasked-value
          outlined
          dense
          stack-label
          fill-mask
          v-model="user.phone"
          label="Celular *"
          mask="(##) #####-####"
          :rules="[(v) => !!v || 'Obrigatório']"
          lazy-rules
        />
      </div>
    </div>

    <q-stepper-navigation class="row">
      <q-btn flat label="Voltar" color="grey-7" @click="$emit('prev')" />
      <q-space />
      <q-btn
        v-if="user.uuid"
        unelevated
        type="submit"
        label="Continuar"
        color="primary"
        icon-right="chevron_right"
        @click="avancar()"
      />
      <q-btn
        v-else
        no-caps
        unelevated
        type="submit"
        label="Cadastrar-se"
        color="green-9"
        icon-right="chevron_right"
        @click="cadastrarUsuario()"
      />
    </q-stepper-navigation>
  </q-form>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs, watch } from "vue";
import { PedidoService } from "./pedido.service";

export default defineComponent({
  name: "StepSeusDados",
  props: {},
  emits: ["next", "prev"],
  setup(props, { emit }) {
    const $service = new PedidoService();

    const data = reactive({
      user: {} as any,
    });

    onMounted(async () => {
      await verificaUsuario();
    });

    async function cadastrarUsuario() {
      await $service.cadastrarUsuario(data.user);
      await verificaUsuario();
    }

    async function verificaUsuario() {
      const response = await $service.verificaUsuario();
      if (response?.user) {
        const { uuid, name, email } = response.user;
        data.user.uuid = uuid;
        data.user.name = name;
        data.user.email = email;
      }
    }

    function avancar() {
      if (!data.user.uuid) {
        cadastrarUsuario();
        return;
      }
      emit("next");
    }

    return {
      ...toRefs(data),
      cadastrarUsuario,
      avancar,
    };
  },
});
</script>
