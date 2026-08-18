# Sistema de Gestión Integral - Club Universitario de Berisso

![UTN FRLP](https://img.shields.io/badge/UTN-FRLP-blue.svg)
![Proyecto Final](https://img.shields.io/badge/Proyecto-Final%202026-green.svg)
![Django](https://img.shields.io/badge/Backend-Django-092E20?style=flat&logo=django&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat&logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)

Repositorio oficial del **Sistema de Gestión Integral para el Club Universitario de Berisso**, desarrollado como Proyecto Final de la carrera de Ingeniería en Sistemas de Información de la **Universidad Tecnológica Nacional - Facultad Regional La Plata (UTN FRLP)**.

---

## 📋 Descripción del Proyecto

Este proyecto surge para dar respuesta a una problemática crítica del Club Universitario de Berisso: la dependencia de un software de escritorio antiguo, cerrado, sin soporte ni documentación que obligaba al personal administrativo a duplicar tareas en soportes manuales y exponía al club a la pérdida de datos históricos.

La nueva plataforma sustituye dicha herramienta obsoleta por un sistema de información moderno, unificado y escalable, diseñado para optimizar tanto la gestión de legajos y finanzas como la comunicación institucional.

---

## 🎯 Objetivos

### Objetivo General
Desarrollar e implementar un sistema de información integral para la gestión de legajos, administración de cobranzas, control de asistencias y automatización de notificaciones del club.

### Objetivos Específicos
* **Diseño y Normalización de Datos:** Base de datos relacional robusta que centraliza y unifica los legajos de jugadores, profesores y vínculos familiares, garantizando integridad referencial.
* **Gestión Documental y Cumplimiento:** Repositorio digital para seguimiento de documentación obligatoria de profesores (certificados de antecedentes penales, títulos habilitantes, CV).
* **Automatización de Gestión Financiera:** Módulo financiero para procesar automáticamente la generación de deudas, registrar flujos de pagos y emitir reportes de morosidad en tiempo real.
* **Arquitectura de Comunicación Segmentada:** Sistema de mensajería digital para difusión automatizada de novedades institucionales filtradas por rol, categoría o estado administrativo.
* **Interoperabilidad Externa:** Análisis de factibilidad para una futura integración de datos con la plataforma analítica Comet.

---

## 🛠️ Stack Tecnológico

* **Backend:** Python / Django
* **Frontend:** React
* **Base de Datos:** SQLite / PostgreSQL (adaptado para 
despliegue local según restricciones de hardware del cliente)
* **Infraestructura:** Docker & Docker Compose
* **Control de Versiones:** Git & GitHub

---

## 👥 Roles de Usuario Soportados

1. **Personal Administrativo:** Agilidad para procesar cobros, actualizar datos de contacto y auditar documentación legal de docentes.
2. **Profesores:** Visibilidad sobre el padrón de alumnos a su cargo y canal de comunicación directo con las familias.
3. **Comisión Directiva:** Reportes de gerenciamiento, estados de cuenta y panoramas generales del padrón para la toma de decisiones estratégicas.
4. **Socios / Familias:** Destinatarios finales del flujo de comunicación automatizada y notificaciones institucionales.

---

## 🚀 Arquitectura y Despliegue

Dado que el club posee restricciones operativas (ej. una única PC administrativa principal), el sistema se proyecta bajo premisas de **eficiencia de recursos y soberanía de datos**:
* **Despliegue Local:** Optimizado para ejecutarse en el hardware existente del club, eliminando costos innecesarios de hosting externo.
* **Migración de Datos:** Incluye procesos ETL y scripts de limpieza para trasladar registros históricos desde planillas y archivos en papel hacia la nueva base de datos relacional.

---
## ⚙️ Configuración Inicial de Variables de Entorno

Antes de ejecutar el proyecto, crea un archivo `.env` en la raíz del repositorio:

```env
DB_NAME=sgcub_db
DB_USER=sgcub_user
DB_PASSWORD=tu_contraseña_segura_aqui
DB_HOST=db
DB_PORT=5432
```
> ⚠️ **Importante:** La variable `DB_PASSWORD` es obligatoria para Docker Compose.

---

## ▶️ Levantamiento Local

### Backend (Django)
1. Ir a la carpeta del backend:
   ```bash
   cd Backend
   ```
2. Activar el entorno virtual:
   - Windows PowerShell:
     ```powershell
     .\env\Scripts\Activate.ps1
     ```
   - Windows CMD:
     ```cmd
     .\env\Scripts\activate.bat
     ```
3. Instalar dependencias (si hace falta):
   ```bash
   pip install -r requirements.txt
   ```
4. Aplicar migraciones:
   ```bash
   python manage.py migrate
   ```
5. Levantar el servidor local:
   ```bash
   python manage.py runserver
   ```

### Frontend (React / Vite)
1. Ir a la carpeta del frontend:
   ```bash
   cd Frontend/SGCUB
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

> El backend se ejecuta por defecto en `http://127.0.0.1:8000` y el frontend en el puerto que Vite asigne, normalmente `http://127.0.0.1:5173`.

---

## 👥 Equipo de Desarrollo

* **Institución:** Universidad Tecnológica Nacional - Facultad Regional La Plata (UTN FRLP)
* **Carrera:** Ingeniería en Sistemas de Información (5to Año)
* **Asignatura:** Proyecto Final (2026)
* **Grupo:** N°12
* **Cliente:** Club Universitario de Berisso
* **Integrantes:**
  * Alvite Damián
  * Capre Rodrigo
  * Di Grappa Emiliano
  * Elizalde Benjamín
  * Preneste Máximo

---

## 📄 Licencia

Este proyecto se desarrolla en el marco académico de la UTN FRLP. Todos los derechos reservados al equipo de desarrollo y la institución.