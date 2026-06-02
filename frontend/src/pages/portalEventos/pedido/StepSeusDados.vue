<template>
  <div>
    <q-form ref="formRef" greedy v-if="!user.uuid && form == 'novoUsuario'">
      <div class="row q-col-gutter-xs">
        <div class="col-12 q-pb-md text-grey-8">
          <span>Dados do usuário principal</span>
        </div>
        <div class="col-12 q-mb-sm">
          <q-btn
            flat
            dense
            no-caps
            class="full-width"
            color="primary"
            icon="person"
            label="Já tenho cadastro"
            @click="entrarComUsuarioCadastrado"
          />
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
    </q-form>

    <div v-if="user.uuid">
      <div class="text-grey-8 q-pb-sm">Dados do usuário principal</div>
      <q-card flat bordered class="q-pa-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-auto">
            <q-avatar color="primary" text-color="white" icon="person" />
          </div>
          <div class="col">
            <div class="text-subtitle2 text-weight-medium">{{ user.name }}</div>
            <div class="text-caption text-grey-6">{{ user.email }}</div>
          </div>
        </div>
        <q-separator class="q-my-sm" />
        <div class="row q-gutter-sm">
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            icon="swap_horiz"
            label="Trocar usuário"
            @click="trocarUsuario"
          />
          <q-btn
            flat
            dense
            no-caps
            color="green-8"
            icon="person_add"
            label="Cadastrar novo usuário"
            @click="trocarUsuario"
          />
        </div>
      </q-card>
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
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref, toRefs } from "vue";
import { PedidoService } from "./pedido.service";

export default defineComponent({
  name: "StepSeusDados",
  props: {},
  emits: ["next", "prev"],
  setup(props, { emit }) {
    const $service = new PedidoService();

    const data = reactive({
      form: ref("novoUsuario"),
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

    function trocarUsuario() {
      data.user = {};
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
      trocarUsuario,
      avancar,
    };
  },
});
</script>
