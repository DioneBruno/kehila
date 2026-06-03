<template>
  <span>
    <q-btn
      disabled
      dense
      flat
      no-caps
      color="primary"
      label="Formulário de inscrição"
      @click="open()"
    />
    <q-dialog full-height full-width v-model="openModal">
      <q-card>
        <q-card-section class="row items-center row">
          <span class="q-ml-sm text-h6">Fomulário de Inscrição</span>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-3">
              <q-list bordered separator>
                <q-item clickable v-ripple>
                  <q-item-section avatar>
                    <q-icon color="primary" name="bluetooth" />
                  </q-item-section>
                  <q-item-section>Nome</q-item-section>
                </q-item>
                <q-item clickable v-ripple>
                  <q-item-section avatar>
                    <q-icon color="primary" name="bluetooth" />
                  </q-item-section>
                  <q-item-section>Documento</q-item-section>
                </q-item>
                <q-item clickable v-ripple>
                  <q-item-section avatar>
                    <q-icon color="primary" name="bluetooth" />
                  </q-item-section>
                  <q-item-section>Email</q-item-section>
                </q-item>
                <q-item clickable v-ripple>
                  <q-item-section avatar>
                    <q-icon color="primary" name="bluetooth" />
                  </q-item-section>
                  <q-item-section>Telefone</q-item-section>
                </q-item>
                <q-item clickable v-ripple>
                  <q-item-section avatar>
                    <q-icon color="primary" name="bluetooth" />
                  </q-item-section>
                  <q-item-section>Cidade/UF</q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="col-4">2</div>
            <div class="col-4">3</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </span>
</template>
<script lang="ts">
import { defineComponent, reactive, ref, toRefs } from "vue";

export default defineComponent({
  name: "PortalEventosEventoFormulario",
  setup() {
    const data = reactive({
      openModal: ref(false),
    });

    function open() {
      data.openModal = true;
    }

    return {
      ...toRefs(data),
      open,
    };
  },
});
</script>
<style scoped></style>
