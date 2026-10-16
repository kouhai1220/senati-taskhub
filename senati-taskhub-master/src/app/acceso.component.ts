// Presenta los formularios de acceso y registro. Por ahora validan los campos, pero necesitan un servidor para crear cuentas e iniciar sesión.

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-acceso',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="acceso">
      <div class="bienvenida">
        <span class="sello">SENATI · TASKHUB</span>
        <h2>Tu talento.<br>Tu próximo logro.</h2>
        <p>Organiza tus tareas, registra tus avances y sigue aprendiendo, incluso sin conexión.</p>
        <div class="ilustracion" aria-hidden="true"><span>✓</span><div>Mi siguiente objetivo<strong>Seguir avanzando</strong><i></i><i></i></div></div>
        <p class="lema">Tu talento también forma parte del futuro.</p>
      </div>
      <div class="tarjeta">
        <div class="emblema" aria-hidden="true">S</div>
        <span class="sello">TU ESPACIO ACADÉMICO</span>
        <h2>{{ registro ? 'Crea tu cuenta' : 'Bienvenido a TaskHub' }}</h2>
        <p>{{ registro ? 'Un nuevo paso en tu formación.' : 'Continúa con tus metas de aprendizaje.' }}</p>
        <div class="pestanas" aria-label="Opciones de acceso">
          <button type="button" [class.activo]="!registro" [attr.aria-pressed]="!registro" (click)="cambiar(false)">Iniciar sesión</button>
          <button type="button" [class.activo]="registro" [attr.aria-pressed]="registro" (click)="cambiar(true)">Registrarme</button>
        </div>
        <form #form="ngForm" (ngSubmit)="mostrarAviso()">
          <ng-container *ngIf="registro"><label for="nombre">Nombre completo</label><input id="nombre" name="nombre" autocomplete="name" [(ngModel)]="nombre" required maxlength="100" placeholder="Tu nombre y apellidos"></ng-container>
          <label for="correo">Correo electrónico</label><input id="correo" name="correo" type="email" autocomplete="email" [(ngModel)]="correo" required email placeholder="nombre@correo.com">
          <label for="clave">Contraseña</label><input id="clave" name="clave" type="password" [attr.autocomplete]="registro ? 'new-password' : 'current-password'" [(ngModel)]="clave" required minlength="8" placeholder="Mínimo 8 caracteres">
          <ng-container *ngIf="registro"><label for="confirmacion">Confirmar contraseña</label><input id="confirmacion" name="confirmacion" type="password" autocomplete="new-password" [(ngModel)]="confirmacion" required placeholder="Repite tu contraseña"><p class="error" *ngIf="confirmacion && clave !== confirmacion">Las contraseñas no coinciden.</p></ng-container>
          <button class="principal" type="submit" [disabled]="form.invalid || (registro && clave !== confirmacion)">{{ registro ? 'Crear cuenta' : 'Iniciar sesión' }} <span aria-hidden="true">→</span></button>
        </form>
        <p class="aviso" role="status">{{ aviso || 'Acceso y registro pendientes de conexión a un servidor. Este formulario no crea cuentas ni guarda contraseñas.' }}</p>
        <button class="invitado" type="button" (click)="entrar.emit()">Continuar al panel local <span aria-hidden="true">→</span></button>
        <p class="pie">TaskHub PWA · Gestión de tareas académicas</p>
      </div>
    </section>`,
  styleUrl: './acceso.component.scss'
})
export class AccesoComponent {
  // Avisa al componente principal cuando el estudiante quiere continuar al panel local.
  @Output() entrar = new EventEmitter<void>();
  registro = false;
  nombre = '';
  correo = '';
  clave = '';
  confirmacion = '';
  aviso = '';
  // Cambia entre acceso y registro y limpia las contraseñas escritas.
  cambiar(registro: boolean): void {
    this.registro = registro;
    this.clave = this.confirmacion = this.aviso = '';
  }
  // Informa que falta conectar la autenticación y limpia las claves sin guardarlas.
  mostrarAviso(): void {
    this.clave = this.confirmacion = '';
    this.aviso = 'Servicio de autenticación no configurado. Puedes continuar al panel local; no se ha creado ninguna cuenta ni iniciado sesión.';
  }
}
