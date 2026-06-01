<template>
  <q-form ref="formRef" @submit.prevent="$emit('next')" greedy>
    <div class="row q-col-gutter-xs">
      <div class="col-12 q-pb-md text-grey-8">
        <span>Dados do usuário principal</span>
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          :model-value="form.cpf"
          label="CPF *"
          outlined
          mask="###.###.###-##"
          unmasked-value
          :rules="[(v) => !!v || 'Obrigatório']"
          lazy-rules
          @update:model-value="update('cpf', $event)"
        />
      </div>
      <div class="col-12">
        <q-input
          :model-value="form.nome"
          label="Nome completo *"
          outlined
          :rules="[(v) => !!v || 'Obrigatório']"
          lazy-rules
          @update:model-value="update('nome', $event)"
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          :model-value="form.email"
          label="E-mail *"
          type="email"
          outlined
          :rules="[(v) => !!v || 'Obrigatório']"
          lazy-rules
          @update:model-value="update('email', $event)"
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          :model-value="form.celular"
          label="Celular *"
          outlined
          mask="(##) #####-####"
          unmasked-value
          :rules="[(v) => !!v || 'Obrigatório']"
          lazy-rules
          @update:model-value="update('celular', $event)"
        />
      </div>
    </div>

    <q-stepper-navigation class="row">
      <q-btn flat label="Voltar" color="grey-7" @click="$emit('prev')" />
      <q-space />
      <q-btn
        unelevated
        type="submit"
        label="Continuar"
        color="primary"
        icon-right="chevron_right"
      />
    </q-stepper-navigation>
  </q-form>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";

interface FormDados {
  nome: string;
  email: string;
  celular: string;
  cpf: string;
}

export default defineComponent({
  name: "StepSeusDados",
  props: {
    form: { type: Object as PropType<FormDados>, required: true },
  },
  emits: ["update:form", "next", "prev"],
  setup(props, { emit }) {
    function update(campo: keyof FormDados, valor: string) {
      emit("update:form", { ...props.form, [campo]: valor });
    }
    return { update };
  },
});
</script>
