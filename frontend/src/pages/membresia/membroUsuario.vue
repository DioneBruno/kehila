<template>
  <q-card flat bordered>
    <q-card-section>
      <p class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm">Acesso ao sistema</p>

      <q-item v-if="usuarioUuid" dense class="q-px-none">
        <q-item-section avatar>
          <q-icon name="verified_user" color="positive" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Possui usuário de acesso</q-item-label>
          <q-item-label caption>Login pelo {{ identificacao }}</q-item-label>
        </q-item-section>
      </q-item>

      <template v-else>
        <p class="text-caption text-grey-7 q-mb-sm">
          Este membro ainda não possui usuário para acessar o sistema.
        </p>
        <q-banner v-if="!podeCriar" dense rounded class="bg-orange-1 text-orange-9 q-mb-sm">
          <template v-slot:avatar>
            <q-icon name="warning" color="orange-8" />
          </template>
          Cadastre o CPF ou o e-mail do membro para criar o usuário.
        </q-banner>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="person_add"
          label="Criar usuário de acesso"
          class="full-width"
          :disable="!podeCriar"
          @click="abrirDialog"
        />
      </template>
    </q-card-section>

    <!-- Dialog de criação do usuário -->
    <q-dialog v-model="dialog">
      <q-card style="width: 460px; max-width: 90vw">
        <q-form ref="formRef" greedy @submit.prevent="salvar">
          <q-card-section>
            <p class="text-h6 q-ma-none">Criar usuário de acesso</p>
            <p class="text-caption text-grey-7 q-ma-none">
              {{ membroNome || "Membro" }} · login pelo {{ identificacao }}
            </p>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-toggle v-model="form.definirSenha" label="Definir uma senha agora" />

            <template v-if="form.definirSenha">
              <q-input
                v-model="form.password"
                outlined
                dense
                label="Senha"
                :type="mostrarSenha ? 'text' : 'password'"
                :rules="[
                  (v: string) => !!v || 'Informe a senha',
                  (v: string) => v.length >= 6 || 'A senha deve ter ao menos 6 caracteres',
                ]"
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
              <q-input
                v-model="form.confirmacao"
                outlined
                dense
                label="Confirmar senha"
                :type="mostrarSenha ? 'text' : 'password'"
                :rules="[(v: string) => v === form.password || 'As senhas não conferem']"
                lazy-rules
              />
            </template>

            <q-banner v-else dense rounded class="bg-blue-1 text-blue-9">
              <template v-slot:avatar>
                <q-icon name="info" color="blue-8" />
              </template>
              O usuário será criado sem senha. Para o primeiro acesso, o membro deve usar
              <b>"Recuperar conta"</b> na tela de login e definir a própria senha.
            </q-banner>

            <q-input
              v-model="form.position"
              outlined
              dense
              label="Cargo (opcional)"
              hint="Ex: Membro, Líder, Secretaria"
            />
            <q-select
              v-model="form.roles"
              outlined
              dense
              label="Papéis (opcional)"
              multiple
              use-input
              use-chips
              new-value-mode="add-unique"
              hide-dropdown-icon
              hint="Digite e pressione Enter para adicionar"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn v-close-popup flat label="Cancelar" color="grey-7" />
            <q-btn unelevated type="submit" label="Criar usuário" color="primary" icon="save" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, toRefs } from "vue";
import { MembresiaService } from "./membresia.service";

function novoForm() {
  return {
    definirSenha: false,
    password: "",
    confirmacao: "",
    position: "",
    roles: [] as string[],
  };
}

export default defineComponent({
  name: "MembroUsuario",
  props: {
    membroUuid: { type: String, required: true },
    membroNome: { type: String as () => string | null, default: null },
    cpf: { type: String as () => string | null, default: null },
    email: { type: String as () => string | null, default: null },
    usuarioUuid: { type: String as () => string | null, default: null },
  },
  emits: ["criado"],
  setup(props, { emit }) {
    const $service = new MembresiaService();

    const data = reactive({
      dialog: false,
      mostrarSenha: false,
    });
    const form = reactive(novoForm());
    const formRef = ref();

    const podeCriar = computed(() => !!props.cpf?.trim() || !!props.email?.trim());
    const identificacao = computed(() => {
      const partes = [];
      if (props.cpf?.trim()) partes.push("CPF");
      if (props.email?.trim()) partes.push("e-mail");
      return partes.join(" ou ");
    });

    function abrirDialog() {
      Object.assign(form, novoForm());
      data.mostrarSenha = false;
      data.dialog = true;
    }

    async function salvar() {
      const resultado = await $service.criarUsuario(props.membroUuid, {
        password: form.definirSenha ? form.password : undefined,
        position: form.position.trim() || undefined,
        roles: form.roles,
      });
      if (!resultado) return;
      data.dialog = false;
      emit("criado", resultado.uuid);
    }

    return {
      ...toRefs(data),
      form,
      formRef,
      podeCriar,
      identificacao,
      abrirDialog,
      salvar,
    };
  },
});
</script>
