# Memoria Técnica

**Proyecto:** Game For All
**Alumno:** [Escribe tu nombre y el de tu compañero aquí]
**Curso:** [Escribe el nombre de tu curso aquí]
**Fecha:** 16 de junio de 2026

---

# 1. Introducción y Objetivos

## 1.1. Descripción
**Game For All** es una plataforma web colaborativa diseñada específicamente para facilitar el intercambio directo de videojuegos físicos entre usuarios de manera intuitiva, rápida y segura. La aplicación nace con el objetivo de establecer un punto de encuentro centralizado para la comunidad *gamer*, donde los usuarios pueden publicar el catálogo de juegos que ya han completado y que desean intercambiar, explorar los títulos publicados por otras personas, gestionar propuestas de intercambio con diferentes estados (pendientes, aceptadas, rechazadas o completadas) y comunicarse en tiempo real mediante un chat interno para acordar los detalles de la transacción física. 

Tecnológicamente, el proyecto se ha estructurado siguiendo una arquitectura de pila completa (*Full-stack*) desacoplada: una interfaz de cliente (*Front-end*) dinámica desarrollada en React y estilizada con Tailwind CSS, y un servidor de aplicaciones (*Back-end*) robusto basado en Node.js y Express, respaldado por un motor de comunicación en tiempo real mediante WebSockets (Socket.io). La persistencia de datos se gestiona a través de una base de datos relacional MySQL alojada en un entorno de producción en la nube.

## 1.2. Justificación de la aplicación (Qué necesidad cubre)
Actualmente, la industria del videojuego genera anualmente miles de títulos en formato físico. Muchos de estos juegos tienen una vida útil corta para el jugador, ya que una vez completa la historia principal o conseguidos los objetivos del juego, el producto suele quedar almacenado y en desuso. 

Ante esta realidad, las opciones de consumo actuales presentan importantes limitaciones:
* **Frustración con tiendas de recompra especializadas:** Las cadenas tradicionales de segunda mano ofrecen importes excesivamente bajos en comparación con el valor original del videojuego adquirido.
* **Falta de enfoque en plataformas genéricas de segunda mano:** Aplicaciones de compraventa generales no disponen de filtros específicos de búsqueda para videojuegos (plataforma, género, estado de conservación) ni están diseñadas exclusivamente para fomentar el trueque, sino que priorizan las transacciones monetarias.

**Game For All** resuelve esta problemática eliminando los intermediarios y fomentando la **economía circular** dentro del sector. La aplicación da una segunda vida a los videojuegos físicos sin necesidad de realizar ninguna transacción económica directa, maximizando el valor de los productos adquiridos por los propios jugadores e impulsando la sostenibilidad a través de la reutilización de recursos.

## 1.3. Alcance del proyecto

### 1.3.1. Objetivos
Los objetivos generales y específicos fijados para este proyecto de fin de ciclo son:
* **Desarrollo Full-stack integrado:** Crear una aplicación web integral totalmente operativa desde la capa de presentación hasta la base de datos en la nube.
* **Seguridad y control de accesos:** Implementar un sistema de registro e inicio de sesión de usuarios seguro mediante el cifrado de contraseñas y la generación de tokens JSON Web Tokens (JWT) para autorización basada en roles (RBAC).
* **Comunicación en tiempo real:** Integrar un canal de comunicación interactivo e instantáneo mediante WebSockets para evitar la dependencia de aplicaciones de mensajería externas.
* **Interfaz usable y adaptativa:** Diseñar una interfaz de usuario moderna, limpia y adaptativa (*responsive*) que garantice una experiencia óptima de navegación en dispositivos móviles, tablets y ordenadores.
* **Despliegue en la nube profesional:** Configurar y desplegar el proyecto en entornos de producción profesionales (Vercel, Render y Aiven) utilizando conexiones seguras SSL.

### 1.3.2. Resultados
Al final del periodo de desarrollo, se han logrado los siguientes resultados tangibles:
1. Una plataforma web de producción alojada en la red, accesible a través de dominios públicos.
2. Un catálogo interactivo donde los usuarios pueden filtrar juegos de manera dinámica por plataforma.
3. Un módulo de solicitudes de intercambio funcional con notificaciones visuales instantáneas.
4. Un chat integrado en tiempo real para el pacto y cierre de los intercambios propuestos.
5. Un sistema de valoración bidireccional mediante puntuación de estrellas y comentarios que ayuda a generar confianza y seguridad en la comunidad de usuarios.

### 1.3.3. Fases entregables
El proyecto se ha desarrollado en un grupo de dos personas siguiendo una metodología iterativa dividida en cinco fases principales:
* **Fase 1: Diseño y Planificación:** Estudio de los requisitos del software, definición de la arquitectura y estructuración del modelo de datos de la base de datos MySQL (Diagrama Entidad-Relación).
* **Fase 2: Desarrollo del Back-end:** Programación de la API RESTful con Express, rutas, controladores, middlewares de seguridad, validaciones de datos y configuración del acceso seguro SSL a la base de datos Aiven.
* **Fase 3: Desarrollo del Front-end:** Maquetación de los componentes de la interfaz de usuario con React, conexión con los servicios de la API del Back-end, y gestión del estado global de la aplicación.
* **Fase 4: Integración en Tiempo Real:** Configuración del servidor y el cliente de WebSockets mediante Socket.io para la implementación de chat directo y alertas visuales.
* **Fase 5: Pruebas, Optimización y Despliegue:** Depuración de código (corrección de lints, warnings de ESLint), pruebas funcionales y configuración final de los entornos de producción en Render (API) y Vercel (Front-end).

## 1.4. Requisitos (Técnicos y funcionales)

### Requisitos Funcionales
* **Gestión de usuarios (Autenticación):** Registro de nuevos perfiles de usuario e inicio de sesión protegido con control de acceso y cierre de sesión seguro.
* **Gestión del catálogo de juegos:** Los usuarios pueden publicar videojuegos introduciendo el título, la plataforma, el género, el estado de conservación física (nuevo, seminuevo, usado), una descripción de texto y una imagen (carga de archivos o enlace directo). Asimismo, el dueño del juego puede editar o eliminar sus publicaciones.
* **Exploración y búsquedas:** Cualquier visitante puede buscar videojuegos mediante una barra de búsqueda de texto y filtrado dinámico por plataforma (PS5, Xbox, Nintendo Switch, etc.).
* **Sistema de favoritos:** Los usuarios registrados pueden guardar videojuegos en su sección de "Favoritos" de forma personalizada.
* **Flujo de intercambios:** Posibilidad de seleccionar un juego deseado y proponer un intercambio ofreciendo un juego propio. El destinatario recibe la propuesta y puede aceptarla, rechazarla (especificando opcionalmente un motivo) o marcar el proceso como finalizado una vez se realiza el trueque presencial.
* **Módulo de reseñas (Ratings):** Sistema para valorar a otros usuarios después de completar un intercambio, definiendo puntuaciones del 1 al 5 y un comentario de texto.
* **Chat en tiempo real:** Comunicación inmediata entre usuarios conectados que hayan iniciado un proceso de negociación.

### Requisitos Técnicos
* **Front-end:** React.js, React Hooks para la gestión del estado, CSS nativo con soporte de componentes modernos y Tailwind CSS para el estilo adaptativo.
* **Back-end:** Node.js, Express para la creación de la API RESTful.
* **Comunicación interactiva:** Socket.io para la capa de transporte bidireccional de WebSockets.
* **Base de datos:** Motor MySQL relacional configurado con conexiones SSL seguras mediante un *pool* de conexiones en el archivo `db.js`.
* **Servidor de Producción (Base de Datos):** Instancia gestionada en la nube de la plataforma Aiven.
* **Alojamiento de aplicaciones:** Despliegue automático del cliente de React en Vercel, y de la aplicación Node.js/Express en Render.

---

# 2. Análisis y Diseño

## 2.1. Front-End y Diseño Conceptual

### 2.1.1. Diagramas de la base de datos (Modelo Entidad-Relación)
Para garantizar la integridad y consistencia de la información, el diseño de datos se ha estructurado mediante un Modelo Entidad-Relación (MER). Este diagrama define las entidades principales del sistema y cómo interactúan entre ellas. Las tablas centrales incluyen:
* **Users:** Almacena las credenciales xifradas (con `bcryptjs`), correos electrónicos únicos, roles de usuario y marcas de tiempo.
* **Games:** Contiene la información de los videojuegos publicados (título, plataforma, género, estado, descripción, imagen y el ID del propietario).
* **Favorites:** Relaciona los usuarios con sus juegos favoritos, garantizando un índice único para evitar duplicados.
* **Trades:** Registra las solicitudes de intercambio, vinculando al usuario solicitante, el usuario receptor, los juegos implicados y el estado de la transacción (`pending`, `accepted`, `rejected`, `completed`, `cancelled`).
* **Messages:** Almacena el historial de chat con los campos del emisor, receptor, texto y fecha de envío.
* **Ratings:** Contiene las puntuaciones con estrellas y comentarios compartidos entre los usuarios evaluadores y evaluados.

*(Inserta aquí la imagen de tu Diagrama Entidad-Relación)*

### 2.1.2. Diagramas de flujo (dfd-0, dfd-1)
Se han desarrollado diagramas de flujo de datos (DFD) para mapear de forma visual cómo viaja la información a través del sistema desde el usuario hasta la base de datos.
* **Nivel 0 (DFD-0):** Muestra el contexto global, representando la interacción del usuario (entidad externa) con el sistema central "Game For All" como proceso único.
* **Nivel 1 (DFD-1):** Desglosa el sistema en sus procesos fundamentales: la gestión de la autenticación, la publicación y exploración del catálogo, el proceso lógico de la propuesta de intercambio y la emisión/recepción de mensajes en tiempo real.

*(Inserta aquí las imágenes de tus Diagramas de Flujo dfd-0 y dfd-1)*

### 2.1.3. Esquemas de la interfaz (Wireframes)
El diseño de la interfaz gráfica se ha planificado mediante la elaboración de *wireframes*. Se ha seguido una filosofía de diseño centrado en el usuario, priorizando una navegación intuitiva y una experiencia visual limpia y sin distracciones. Los esquemas representan las pantallas clave del proyecto:
1. **Página Principal (Landing / Catálogo):** Con una barra de búsqueda prominente y una cuadrícula de tarjetas para mostrar los videojuegos disponibles de manera visual.
2. **Panel de Gestión (Dashboard):** Un espacio personal donde el usuario puede ver sus juegos publicados y gestionar los intercambios entrantes y salientes.
3. **Ventana de Chat:** Una vista focalizada para permitir una comunicación fluida, inspirada en las aplicaciones de mensajería modernas.

*(Inserta aquí las imágenes de tus Wireframes)*

## 2.2. Back-end

### 2.2.1. Estructura del proyecto
El servidor se ha construido utilizando un entorno Node.js con el *framework* Express. La arquitectura del código fuente se ha organizado siguiendo los principios de separación de responsabilidades, utilizando una variación del patrón de diseño Modelo-Controlador-Rutas (para APIs RESTful). La estructura de directorios se divide de la siguiente manera:

* `config/`: Contiene los archivos de configuración central, como la instanciación del *pool* de conexiones a la base de datos MySQL (`db.js`) que maneja de manera segura las credenciales cifradas y SSL requeridas por Aiven.
* `controllers/`: Incluye la lógica de negocio principal. Aquí se procesan las peticiones del cliente (Front-end), se interactúa con la base de datos y se generan las respuestas en formato JSON (ej: `auth.controller.js`, `game.controller.js`, `trade.controller.js`, `messages.controller.js`).
* `routes/`: Define los puntos de acceso de la API (*endpoints*). Actúa como distribuidor, asignando cada URL solicitada al controlador correspondiente.
* `middleware/`: Funciones de intermediación que se ejecutan antes de los controladores, utilizadas para validar datos de entrada y verificar los tokens de autenticación de usuario (JWT).
* `sql/`: Contiene los scripts de inicialización SQL (`game_for_all.sql`) que definen el esquema físico de la base de datos.
* `setupDB.js`: Script automatizado para la creación de las tablas necesarias en el entorno de producción de Aiven de forma rápida y reproducible.
* `server.js`: Punto de entrada de la aplicación back-end. Inicializa el servidor Express, configura CORS, carga las rutas REST y levanta el socket de Socket.io para la sincronía en tiempo real.

---

# 3. Tecnologías Utilizadas

## 3.1. Justificación de los lenguajes, frameworks y librerías

La elección de las tecnologías o *stack* tecnológico para **Game For All** se ha basado en criterios de rendimiento, escalabilidad y la necesidad de desarrollar una aplicación moderna con comunicación en tiempo real. 

* **Front-End (React y Tailwind CSS):**
    * Se ha optado por **React.js** debido a su arquitectura basada en componentes reutilizables y su eficiente manipulación del DOM virtual, lo cual es ideal para gestionar el catálogo dinámico de videojuegos y los estados de la interfaz sin necesidad de recargar la página.
    * **Tailwind CSS** se ha utilizado como *framework* de estilos por su enfoque "utility-first", permitiendo un desarrollo ágil y garantizando un diseño totalmente adaptativo (*responsive*) y coherente sin la necesidad de mantener extensos archivos CSS personalizados.

* **Back-End (Node.js y Express):**
    * **Node.js** proporciona un entorno de ejecución asóncrono y orientado a eventos, perfecto para manejar múltiples solicitudes simultáneas (como las del chat en tiempo real) con un alto rendimiento. 
    * **Express** se implementó por ser un *framework* minimalista y flexible que facilita enormemente la creación de la API RESTful y la gestión de rutas y *middlewares*.

* **Comunicación en tiempo real (Socket.io):**
    * Para implementar el chat entre usuarios, las peticiones HTTP tradicionales no eran eficientes. **Socket.io** fue elegido porque establece una conexión bidireccional y persistente (WebSockets) entre el cliente y el servidor, asegurando que los mensajes se entreguen instantáneamente.

* **Base de Datos y Despliegue (MySQL, Aiven, Vercel, Render):**
    * **MySQL:** Un motor de base de datos relacional es la opción más lógica para este proyecto, ya que las entidades del sistema (Usuarios, Juegos, Intercambios y Mensajes) tienen relaciones claras y estructuradas.
    * **Aiven:** Proporciona una base de datos MySQL gestionada en la nube, garantizando alta disponibilidad y seguridad sin necesidad de administrar servidores físicos.
    * **Vercel y Render:** Se eligieron por su integración continua (CI/CD) con GitHub. Vercel está altamente optimizado para aplicaciones React, mientras que Render ofrece un entorno robusto y fácil de configurar para servidores Node.js.

## 3.2. Problemas técnicos

Durante el ciclo de desarrollo, surgieron diversos retos técnicos que requirieron investigación y refactorización del código. 

**Problemas técnicos Sprint-1 o Primera Entrega:**

1.  **Errores de compilación estrictos en Vercel (ESLint CI):**
    * *Problema:* Durante los primeros intentos de despliegue del Front-end, Vercel detenía la compilación (Build Failed) mostrando errores de variables o funciones declaradas pero no utilizadas (ej. `renderLanding`, `marketCategories`). Esto se debe a que Vercel trata las advertencias (warnings) de ESLint como errores críticos en entornos de producción (donde `CI=true` se activa por defecto).
    * *Solución:* Se realizó una depuración exhaustiva del código fuente en `App.js` y otros componentes, eliminando fragmentos de código inactivo, limpiando las importaciones obsoletas (como el import de `useCallback` no utilizado) y optimizando las funciones, logrando así un despliegue exitoso y limpio de advertencias en producción.

2.  **Conexión segura y análisis de la URI con Aiven (SSL):**
    * *Problema:* La conexión entre el servidor de Node.js (Render) y la base de datos MySQL en Aiven fallaba repetidamente lanzando errores de timeout o rechazo de credenciales. Aiven requiere de forma estricta cifrado SSL y proporciona una URI de conexión completa, la cual el driver de MySQL no procesaba correctamente con variables individuales planas.
    * *Solución:* Se integró un analizador automático de URI en el archivo de configuración `db.js` utilizando la clase nativa `URL` de JavaScript para segmentar los componentes de la cadena de conexión. Asimismo, se inyectaron de forma obligatoria los parámetros SSL `{ ssl: { rejectUnauthorized: false } }`, garantizando una conexión segura contra Aiven sin alertas ni advertencias en el registro de inicio.

3.  **Bloqueos por Políticas de CORS (Cross-Origin Resource Sharing):**
    * *Problema:* Al estar el Front-end alojado en un dominio (Vercel) y el Back-end en otro distinto (Render), los navegadores bloqueaban las peticiones de la API por motivos de seguridad.
    * *Solución:* Se configuró e implementó el *middleware* `cors` en el servidor Express, definiendo explícitamente el origen permitido (la URL de Vercel) y habilitando el paso de credenciales y cabeceras necesarias para la comunicación segura.

---

# 4. Pruebas y Despliegue

## 4.1. Casos de prueba
Para asegurar la calidad, fiabilidad y estabilidad de la plataforma **Game For All**, se han diseñado y ejecutado diversos casos de prueba que abarcan los flujos críticos de la aplicación. Estos test incluyen la validación del registro y autenticación de usuarios, la correcta publicación de los videojuegos con carga de imágenes, el ciclo de vida completo de una solicitud de intercambio (desde la propuesta hasta la aceptación o rechazo) y la verificación de la entrega instantánea de mensajes en el chat a través de WebSockets.

* **Enlace al documento de pruebas:** `[Inserta aquí la URL de tu documento de casos de prueba]`

## 4.2. Ubicación de las documentaciones
Toda la documentación técnica del proyecto, incluyendo los diagramas conceptuales (Modelo Entidad-Relación y Diagramas de Flujo), esquemas de interfaz (Wireframes), guías de uso y la presente memoria técnica, se encuentran centralizados y almacenados en la nube para facilitar su acceso y revisión por parte del equipo evaluador.

* **URL de la documentación:** `[Inserta aquí el enlace a tu Google Drive, repositorio de GitHub u otra carpeta compartida]`

## 4.3. Detalles sobre el alojamiento web
El despliegue del proyecto se ha realizado en un entorno de producción profesional, adoptando una arquitectura distribuida que separa las responsabilidades del sistema en tres servicios especializados para garantizar escalabilidad y máxima eficiencia:

* **Front-end (Vercel):** La interfaz de usuario desarrollada en React se hospeda en la plataforma Vercel. Se ha elegido esta opción por su potente Red de Entrega de Contenido (CDN) global y su excelente optimización nativa para el enrutamiento de aplicaciones *Single Page Application* (SPA).
* **Back-end (Render):** La API RESTful construida con Node.js y Express, junto con el servidor de Socket.io, opera en Render. Este servicio proporciona un entorno de ejecución robusto y continuo que permite mantener el servidor a la escucha de peticiones HTTP y gestionar eventos persistentes en tiempo real.
* **Base de Datos (Aiven):** La persistencia de datos se gestiona a través de una instancia de MySQL 8 alojada en la nube mediante Aiven (apoyada en la infraestructura de DigitalOcean). La conexión entre Render y Aiven está estrictamente configurada para requerir protocolos de cifrado SSL, asegurando la privacidad de la información.

## 4.4. Instrucciones de despliegue
El proceso de integración y despliegue continuo (CI/CD) está completamente automatizado gracias a la vinculación directa de las plataformas de alojamiento con el repositorio de control de versiones en GitHub. Los pasos necesarios para efectuar un despliegue son los siguientes:

1.  **Configuración de Variables de Entorno:**
    * En Render (Back-end): Se debe configurar la variable `DATABASE_URL` con la cadena de conexión URI proporcionada por Aiven.
    * En Vercel (Front-end): Se debe establecer la variable `REACT_APP_API_URL` apuntando al dominio público generado por Render.
2.  **Control de Versiones:** El desarrollador realiza los cambios en el código local, los añade al índice (`git add .`), crea un punto de control (`git commit`) y los sube a la rama principal (`git push origin main`).
3.  **Auto-Despliegue (Auto-Deploy):** Al detectar un nuevo *push* en la rama `main`, tanto Vercel como Render inician automáticamente sus procesos de construcción (*Build*). Instalan las dependencias (`npm install`), compilan los *assets* de producción (`npm run build` en el caso del Front-end) y publican la nueva versión de la plataforma sin necesidad de intervención manual.

## 4.5. Estudio de rendimiento a producción
Se ha llevado a cabo un análisis exhaustivo del rendimiento del sitio web operando ya en su entorno de producción definitivo (Vercel) utilizando la herramienta de auditoría **Google Lighthouse**. 

Los resultados obtenidos en el análisis inicial reflejan un buen compromiso entre funcionalidad y optimización para un proyecto de esta envergadura:
* **SEO (83/100):** La plataforma está altamente optimizada para los motores de búsqueda, con etiquetas semánticas y enlaces rastreables correctamente configurados.
* **Accesibilidad (75/100) y Buenas Prácticas (73/100):** El sitio cumple con una gran parte de los estándares de accesibilidad visual y estructural.
* **Rendimiento (25/100):** El *First Contentful Paint (FCP)* y el *Largest Contentful Paint (LCP)* muestran tiempos de carga iniciales elevados. Tras analizar el desglose, se concluye que esto es debido al tamaño de los paquetes JavaScript de terceros (como integraciones de utilidades) y archivos de estilos globales no minimizados. Como trabajo futuro, se plantea la implementación de *Lazy Loading* (carga diferida) y la reducción del código JavaScript no utilizado (Code Splitting) para mejorar drásticamente esta métrica.

*(Opcional: Puedes insertar aquí una captura de pantalla de los 4 círculos de puntuación de Lighthouse)*
