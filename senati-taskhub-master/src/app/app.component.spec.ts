// Comprueba con pruebas automáticas que se muestran las tareas, funciona la navegación y se guardan los avances. También verifica el manejo de errores y los cambios de conexión.


/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { TareaService } from './services/tarea.service';
import { StorageService } from './services/storage.service';

describe('AppComponent', () => {
  const tarea = { id: 101, curso: 'Desarrollo de Software PWA', titulo: 'Entregable 01',
    instructor: 'Ing. Jorge Luque', fechaEntrega: '2026-10-15', estado: 'Pendiente' };
  let storage: jasmine.SpyObj<StorageService>;
  beforeEach(async () => {
    storage = jasmine.createSpyObj('StorageService', ['guardarEntregaLocal', 'obtenerEntregasPendientes']);
    storage.guardarEntregaLocal.and.resolveTo();
    storage.obtenerEntregasPendientes.and.resolveTo([]);
    await TestBed.configureTestingModule({ imports: [AppComponent], providers: [
      { provide: TareaService, useValue: { obtenerTareas: () => of([tarea]) } },
      { provide: StorageService, useValue: storage }
    ] }).compileComponents();
  });
  it('muestra el catálogo y la cabecera institucional', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('SENATI | TaskHub');
    expect(fixture.nativeElement.querySelectorAll('.tareas li').length).toBe(1);
    fixture.destroy();
  });
  it('guarda offline y conserva el comentario si falla IndexedDB', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    app.online = false;
    app.comentarioEntrega = 'Mi avance';
    await app.enviarEntrega();
    expect(storage.guardarEntregaLocal).toHaveBeenCalledWith({ tareaId: 101,
      comentario: 'Mi avance', usuario: 'Estudiante SENATI' });
    expect(app.comentarioEntrega).toBe('');
    storage.guardarEntregaLocal.and.rejectWith(new Error('Fallo de almacenamiento'));
    app.comentarioEntrega = 'Conservar';
    await app.enviarEntrega();
    expect(app.comentarioEntrega).toBe('Conservar');
    fixture.destroy();
  });
  it('permite entrar al panel local y volver a las pantallas de acceso', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('main').hidden).toBeTrue();
    fixture.nativeElement.querySelector('.invitado').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('main').hidden).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-acceso')).toBeNull();
    fixture.nativeElement.querySelector('.boton-acceso').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-acceso')).not.toBeNull();
    fixture.nativeElement.querySelectorAll('.pestanas button')[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#nombre')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#confirmacion')).not.toBeNull();
    fixture.destroy();
  });
  it('calcula el resumen y muestra el avance recuperado después de guardar', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const app = fixture.componentInstance;
    app.listaTareas = [tarea, { ...tarea, id: 102, estado: 'Completado' }];
    expect(app.tareasPendientes).toBe(1);
    expect(app.tareasCompletadas).toBe(1);
    storage.obtenerEntregasPendientes.and.resolveTo([{ id: 7, tareaId: 101,
      comentario: 'Avance persistido', usuario: 'Estudiante SENATI',
      fechaRegistro: '2026-10-11T12:00:00Z', estadoSincronizacion: 'PENDIENTE' }]);
    app.comentarioEntrega = 'Avance persistido';
    await app.enviarEntrega();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.avances').textContent).toContain('Avance persistido');
    expect(app.tipoNotificacion).toBe('exito');
    expect(app.avancesGuardados[0].estadoSincronizacion).toBe('PENDIENTE');
    fixture.destroy();
  });
  it('detecta desconexión y recupera pendientes al reconectar sin declarar un envío', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    storage.obtenerEntregasPendientes.and.resolveTo([{ id: 1, tareaId: 101, comentario: 'Avance',
      usuario: 'Estudiante SENATI', fechaRegistro: '2026-10-11', estadoSincronizacion: 'PENDIENTE' }]);
    window.dispatchEvent(new Event('offline'));
    expect(app.online).toBeFalse();
    window.dispatchEvent(new Event('online'));
    await fixture.whenStable();
    expect(app.online).toBeTrue();
    expect(app.notificacionMensaje).toContain('Sincronización no disponible');
    fixture.destroy();
  });
});
