<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="emit('update:modelValue', $event)" @show="aoAbrir">
    <q-card style="max-width: 560px; width: 100%">
      <q-card-section class="row items-center">
        <span class="text-h6">{{ editando ? "Editar usuário" : "Novo usuário" }}</span>
        <q-space />
        <q-btn flat round dense icon="close" @click="fechar" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-banner
          v-if="outrasEmpresas.length"
          dense
          rounded
          class="bg-blue-1 text-grey-9 q-mb-md"
        >
          Também acessa: {{ outrasEmpresas.map((e) => e.name).join(", ") }}. Senha, e-mail, CPF e
          telefone mudam lá também.
        </q-banner>

        <q-form greedy @submit.prevent="salvar">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="form.name"
                label="Nome *"
                filled
                :rules="[(v) => !!v || 'Obrigatório']"
                lazy-rules
              />
            </div>
            <div class="col-12">
              <q-input v-model="form.email" label="E-mail" type="email" filled />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.cpf" label="CPF" filled mask="###.###.###-##" unmasked-value />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.phone"
                label="Telefone"
                filled
                mask="(##) #####-####"
                fill-mask
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.position"
                label="Cargo"
                filled
                emit-value
                map-options
                :options="cargos"
              />
            </div>
            <div v-if="editando" class="col-12 col-sm-6 row items-center">
              <q-toggle v-model="form.isAccepted" label="Ativo" color="positive" />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.password"
                :label="editando ? 'Nova senha' : 'Senha *'"
                filled
                :type="mostrarSenha ? 'text' : 'password'"
                :hint="editando ? 'Preencha apenas para alterar a senha atual' : undefined"
                :rules="editando ? [] : [(v) => !!v || 'Obrigatório']"
                lazy-rules
              >
                <template v-slot:append>
                  <q-icon
                    :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="mostrarSenha = !mostrarSenha"
                  />
                </template>
              </q-input>
            </div>
          </div>

          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn flat label="Cancelar" color="grey-7" @click="fechar" />
            <q-btn unelevated type="submit" label="Salvar" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, toRefs, type PropType } from "vue";
import { AdminEmpresaService, CARGOS_USUARIO } from "./admin.service";

const formVazio = () => ({
  name: "",
  email: "",
  cpf: "",
  phone: "",
  position: "usuario",
  password: "",
  isAccepted: true,
});

export default defineComponent({
  name: "AdminEmpresaUsuarioDialog",
  props: {
    modelValue: { type: Boolean, default: false },
    empresaUuid: { type: String, required: true },
    usuarioUuid: { type: String as PropType<string | undefined>, default: undefined },
  },
  emits: ["update:modelValue", "salvo"],
  setup(props, { emit }) {
    const $service = new AdminEmpresaService();

    const data = reactive({
      form: formVazio(),
      roles: [] as string[],
      outrasEmpresas: [] as { uuid: string; name: string }[],
      mostrarSenha: false,
    });

    const editando = computed(() => !!props.usuarioUuid);

    async function aoAbrir() {
      data.form = formVazio();
      data.roles = [];
      data.outrasEmpresas = [];
      data.mostrarSenha = false;
      if (!props.usuarioUuid) return;
      const u = await $service.detalharUsuario(props.empresaUuid, props.usuarioUuid);
      if (!u) {
        emit("update:modelValue", false);
        return;
      }
      data.form = {
        name: u.name ?? "",
        email: u.email ?? "",
        cpf: u.cpf ?? "",
        phone: u.phone ?? "",
        position: u.position ?? "usuario",
        password: "",
        isAccepted: u.isAccepted ?? true,
      };
      data.roles = u.roles ?? [];
      data.outrasEmpresas = u.outrasEmpresas ?? [];
    }

    function fechar() {
      emit("update:modelValue", false);
    }

    async function salvar() {
      const f = data.form;
      const base = {
        name: f.name,
        cpf: f.cpf || undefined,
        email: f.email || undefined,
        phone: f.phone || undefined,
        position: f.position || undefined,
      };
      const ok = props.usuarioUuid
        ? await $service.editarUsuario(props.empresaUuid, props.usuarioUuid, {
            ...base,
            password: f.password || undefined,
            roles: data.roles,
            isAccepted: f.isAccepted,
          })
        : await $service.criarUsuario(props.empresaUuid, { ...base, password: f.password });
      if (ok) {
        emit("update:modelValue", false);
        emit("salvo");
      }
    }

    return { ...toRefs(data), emit, editando, cargos: CARGOS_USUARIO, aoAbrir, fechar, salvar };
  },
});
</script>
