// Guarda y consulta los avances en la base de datos del navegador (IndexedDB). Los datos permanecen en este dispositivo; todavía no se envían a un servidor.

import { Injectable } from '@angular/core';
export interface Entrega { tareaId: number; comentario: string; usuario: string; }
export interface EntregaPendiente extends Entrega {
  id: number;
  fechaRegistro: string;
  estadoSincronizacion: 'PENDIENTE';
}
@Injectable({ providedIn: 'root' })
export class StorageService {
  private dbName = 'senatiTaskDB';
  private storeName = 'entregas_pendientes';
  // Abre la base de datos y crea el espacio para los avances si es la primera vez.
  async abrirDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  // Guarda el comentario con su tarea, fecha e identificador. Queda pendiente de sincronización.
  async guardarEntregaLocal(entrega: Entrega): Promise<void> {
    const db = await this.abrirDB();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        transaction.objectStore(this.storeName).add({ ...entrega,
          fechaRegistro: new Date().toISOString(), estadoSincronizacion: 'PENDIENTE' });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('Transacción cancelada'));
      });
    } finally { db.close(); }
  }
  // Lee los avances guardados para mostrarlos en el historial.
  async obtenerEntregasPendientes(): Promise<EntregaPendiente[]> {
    const db = await this.abrirDB();
    try {
      return await new Promise<EntregaPendiente[]>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const request = transaction.objectStore(this.storeName).getAll();
        transaction.oncomplete = () => resolve(request.result as EntregaPendiente[]);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('Transacción cancelada'));
      });
    } finally { db.close(); }
  }
}
