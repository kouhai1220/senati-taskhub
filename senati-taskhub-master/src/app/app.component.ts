// Coordina la pantalla principal: carga las tareas, muestra el resumen y permite guardar y consultar avances en este dispositivo.

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccesoComponent } from './acceso.component';
import { Tarea, TareaService } from './services/tarea.service';
import { EntregaPendiente, StorageService } from './services/storage.service';
@Component({ selector: 'app-root', imports: [CommonModule, FormsModule, AccesoComponent],
  templateUrl: './app.component.html', styleUrl: './app.component.scss' })
export class AppComponent implements OnInit, OnDestroy {
  title = 'senati-taskhub';
  // Estas variables controlan la pantalla visible, los datos del formulario y los mensajes al estudiante.
  mostrandoAcceso = true;
  online = navigator.onLine;
  private tareaService = inject(TareaService);
  private storageService = inject(StorageService);
  listaTareas: Tarea[] = [];
  tareaSeleccionadaId: number | null = null;
  comentarioEntrega = '';
  notificacionMensaje = '';
  errorCatalogo = '';
  guardando = false;
  avancesGuardados: EntregaPendiente[] = [];
  cargandoAvances = true;
  errorAvances = '';
  tipoNotificacion: 'info' | 'exito' | 'error' = 'info';
  // Calcula las cantidades del resumen según el estado de las tareas.
  get tareasPendientes(): number {
    return this.listaTareas.filter(tarea => tarea.estado === 'Pendiente').length;
  }
  get tareasCompletadas(): number {
    return this.listaTareas.filter(tarea => tarea.estado === 'Completado').length;
  }
  tituloTarea(id: number): string {
    return this.listaTareas.find(tarea => tarea.id === id)?.titulo ?? `Tarea ${id}`;
  }
  // Actualiza el estado de conexión y vuelve a consultar los datos al recuperar internet.
  private alConectar = () => {
    this.online = true;
    this.cargarTareas();
    void this.recuperarPendientes();
  };
  private alDesconectar = () => { this.online = false; };
  // Al abrir la aplicación, carga las tareas, recupera los avances y escucha los cambios de conexión.
  ngOnInit(): void {
    window.addEventListener('online', this.alConectar);
    window.addEventListener('offline', this.alDesconectar);
    this.cargarTareas();
    void this.recuperarPendientes();
  }
  // Deja de escuchar los eventos cuando este componente deja de utilizarse.
  ngOnDestroy(): void {
    window.removeEventListener('online', this.alConectar);
    window.removeEventListener('offline', this.alDesconectar);
  }
  // Obtiene las tareas y selecciona una para el formulario. Si falla, informa al estudiante.
  cargarTareas(): void {
    this.tareaService.obtenerTareas().subscribe({
      next: data => {
        this.listaTareas = data;
        this.errorCatalogo = '';
        if (!data.some(tarea => tarea.id === this.tareaSeleccionadaId)) {
          this.tareaSeleccionadaId = data[0]?.id ?? null;
        }
      },
      error: () => { this.errorCatalogo = 'No se pudo recuperar el catálogo. Conéctate para cargarlo por primera vez.'; }
    });
  }
  // Recupera los avances del dispositivo y muestra primero los más recientes.
  private async recuperarPendientes(mostrarMensaje = true): Promise<void> {
    this.cargandoAvances = true;
    try {
      const pendientes = await this.storageService.obtenerEntregasPendientes();
      this.avancesGuardados = [...pendientes].sort((a, b) => b.id - a.id);
      this.errorAvances = '';
      if (pendientes.length && mostrarMensaje) {
        this.tipoNotificacion = 'info';
        this.notificacionMensaje = `${pendientes.length} entrega(s) pendiente(s) conservada(s) en el dispositivo. Sincronización no disponible: no hay un servidor configurado.`;
      }
    } catch {
      this.errorAvances = 'No se pudo recuperar el almacenamiento local.';
    } finally { this.cargandoAvances = false; }
  }
  // Valida el formulario y guarda el avance localmente. Si funciona, limpia el comentario; si falla, lo conserva para reintentar.
  async enviarEntrega(): Promise<void> {
    if (this.guardando || !this.comentarioEntrega.trim() ||
        !this.listaTareas.some(tarea => tarea.id === this.tareaSeleccionadaId)) return;
    this.guardando = true;
    try {
      await this.storageService.guardarEntregaLocal({ tareaId: this.tareaSeleccionadaId!,
        comentario: this.comentarioEntrega, usuario: 'Estudiante SENATI' });
      this.tipoNotificacion = 'exito';
      this.notificacionMensaje = this.online
        ? 'Entrega guardada en el dispositivo. Estado: PENDIENTE. Envío no disponible: no hay un servidor configurado.'
        : 'Sin conexión: entrega guardada en el dispositivo. Estado: PENDIENTE.';
      this.comentarioEntrega = '';
      await this.recuperarPendientes(false);
    } catch {
      this.tipoNotificacion = 'error';
      this.notificacionMensaje = 'No se pudo guardar la entrega. El comentario se conserva para reintentar.';
    } finally { this.guardando = false; }
  }
}
