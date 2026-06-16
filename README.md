# Game For All - FCT Repository

Este repositorio contiene los entregables del proyecto final de ciclo **Game For All**, una plataforma web colaborativa para el intercambio de videojuegos físicos. El repositorio incluye la documentación técnica completa, los diagramas UML, el código fuente del proyecto y los resultados de las pruebas de rendimiento.

## 📋 Índice

- [💻 Estructura del Proyecto](#-estructura-del-proyecto)
- [🎨 Arquitectura de la Aplicación](#-arquitectura-de-la-aplicación)
- [📁 Estructura del Backend](#-estructura-del-backend)
- [⚛️ Estructura del Frontend](#-estructura-del-frontend)
- [🔧 Requisitos](#-requisitos)
- [🚀 Instalación](#-instalación)
- [▶️ Ejecución](#️-ejecución)
- [📋 Uso](#-uso)
- [🧪 Pruebas](#-pruebas)
- [📈 Estudio de Rendimiento](#-estudio-de-rendimiento)
- [📝 Memòria Tècnica](#-memòria-tècnica)

## 💻 Estructura del Proyecto

```
/Game-for-all
├── backend/                  # Servidor Node.js y API RESTful
│   ├── config/               # Configuración del servidor (dotenv, db)
│   ├── controllers/          # Lógica de negocio
│   ├── middlewares/          # Middlewares (auth, upload, error)
│   ├── models/               # Modelos de la base de datos (Sequelize)
│   ├── routes/               # Definición de rutas API
│   ├── services/             # Servicios de negocio
│   ├── uploads/              # Archivos subidos
│   ├── package.json
│   └── server.js
├── frontend/                 # Cliente React y UI
│   ├── public/
│   ├── src/
│   │   ├── api/              # Configuración de axios
│   │   ├── assets/           # Imágenes, iconos, fuentes
│   │   ├── components/       # Componentes React reutilizables
│   │   ├── contexts/         # Contextos y estado global
│   │   ├── hooks/            # Custom hooks de React
│   │   ├── pages/            # Páginas principales de la aplicación
│   │   ├── styles/           # Estilos y variables globales
│   │   └── App.jsx
│   ├── .env.local
│   ├── package.json
│   └── vite.config.js
├── public/                   # Documentación y recursos públicos
│   ├── Diagrama Entidad-Relación.jpg
│   └── Memòria Tècnica.md
├── .gitignore
└── README.md
```

## 🎨 Arquitectura de la Aplicación

El proyecto sigue una arquitectura **Full-stack desacoplada** con las siguientes capas:

1.  **Cliente (Frontend):**
    -   **Framework:** React 19
    -   **Estilos:** Tailwind CSS 4.1
    -   **Build Tool:** Vite 7
    -   **Estado Global:** React Context API + useState + useReducer
    -   **Comunicación:** Axios + Socket.io Client

2.  **Servidor (Backend):**
    -   **Runtime:** Node.js 22.x
    -   **Framework:** Express.js 4.x
    -   **ORM:** Sequelize 7.x
    -   **Base de Datos:** MySQL 8.x (Aiven)
    -   **Autenticación:** JWT (JSON Web Tokens)
    -   **Comunicación:** Socket.io Server
    -   **Despliegue:** Render

3.  **Infraestructura Cloud:**
    -   **Backend:** Render (Hosting + Base de Datos)
    -   **Frontend:** Vercel (Hosting)
    -   **Base de Datos:** Aiven (MySQL Managed Service)

## 📁 Estructura del Backend

El backend sigue una estructura modular basada en patrones de diseño MVC y servicios:

```
backend/
├── config/
│   ├── database.js         # Configuración de Sequelize y conexión MySQL
│   ├── dotenv.js           # Inicialización de variables de entorno
│   └── index.js            # Exportación de configuraciones
│
├── controllers/            # Manejo de peticiones HTTP
│   ├── auth.controller.js  # Registro e inicio de sesión
│   ├── game.controller.js  # CRUD de juegos, búsquedas, filtros
│   ├── trade.controller.js # Gestión de intercambios
│   ├── message.controller.js #mensajes de chat
│   └── rating.controller.js # Sistema de valoraciones
│
├── middlewares/
│   ├── authMiddleware.js   # Verificación de tokens JWT
│   ├── errorHandler.js     # Manejo centralizado de errores
│   ├── upload.js           # Middleware de subida de imágenes
│   └── validationMiddleware.js # Validación de esquemas Joi
│
├── models/                 # Modelos Sequelize
│   ├── index.js            # Definición de relaciones
│   ├── user.model.js
│   ├── game.model.js
│   ├── trade.model.js
│   ├── message.model.js
│   └── rating.model.js
│
├── routes/                 # Definición de rutas
│   ├── auth.routes.js
│   ├── game.routes.js
│   ├── trade.routes.js
│   ├── message.routes.js
│   └── rating.routes.js
│
├── services/               # Lógica de negocio
│   ├── tradeService.js     # Lógica compleja de intercambios
│   ├── messagingService.js # Lógica de chat
│   └── ratingService.js    # Lógica de valoraciones
│
└── uploads/                # Imágenes de portada subidas por usuarios
```

## ⚛️ Estructura del Frontend

El frontend está organizado por capas de funcionalidad:

```
frontend/
├── src/
│   ├── api/                # Configuración de Axios
│   │   ├── axios.js        # Configuración del cliente Axios con interceptores
│   │   └── index.js        # Exportación de servicios API
│   │
│   ├── assets/             # Recursos estáticos
│   │   ├── fonts/
│   │   ├── icons/
│   │   └── images/
│   │
│   ├── components/         # Componentes reutilizables
│   │   ├── ui/             # Componentes UI básicos (Button, Input, Modal)
│   │   ├── game/           # Componentes específicos de juegos
│   │   ├── trade/          # Componentes de intercambios
│   │   ├── chat/           # Componentes de chat en tiempo real
│   │   ├── auth/           # Componentes de autenticación
│   │   └── layout/         # Layout principal (Navbar, Footer, Sidebar)
│   │
│   ├── contexts/           # Contextos de React para estado global
│   │   ├── AuthContext.jsx # Autenticación del usuario
│   │   ├── TradeContext.jsx # Estado de intercambios
│   │   ├── GameContext.jsx   # Catálogo de juegos
│   │   └── SocketContext.jsx # Conexión Socket.io
│   │
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useGames.js
│   │   ├── useTrades.js
│   │   ├── useChat.js
│   │   └── useSearch.js
│   │
│   ├── pages/              # Vistas principales de la aplicación
│   │   ├── HomePage.jsx
│   │   ├── CatalogPage.jsx
│   │   ├── GameDetailPage.jsx
│   │   ├── TradeListPage.jsx
│   │   ├── TradeChatPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── FavoritesPage.jsx
│   │   ├── SearchResultsPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── styles/             # Estilos globales
│   │   ├── index.css
│   │   └── variables.css
│   │
│   └── App.jsx             # Componente raíz
│
├── .env.local              # Variables de entorno del frontend
├── package.json
└── vite.config.js          # Configuración de Vite
