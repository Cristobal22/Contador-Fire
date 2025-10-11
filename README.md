# Contador Experto

Contador Experto es una aplicación web de contabilidad y remuneraciones diseñada para la gestión financiera de pequeñas y medianas empresas. La plataforma permite a los usuarios administrar la contabilidad, procesar remuneraciones, y generar reportes financieros clave de forma eficiente y segura.

Construida con un stack tecnológico moderno, la aplicación ofrece una experiencia de usuario rápida y fluida, con un backend robusto y escalable.

## Stack Tecnológico

*   **Frontend:** React, TypeScript, Vite
*   **Backend & Base de Datos:** [Supabase](https://supabase.io/)
*   **Despliegue (CI/CD):** [Netlify](https://www.netlify.com/)
*   **Control de Versiones:** Git & GitHub

## Características Principales

*   **Gestión de Contabilidad:** Plan de cuentas, comprobantes contables, libros diarios y mayores.
*   **Módulo de Remuneraciones:** Ficha de personal, liquidaciones de sueldo, generación de archivos de Previred.
*   **Multi-empresa:** Capacidad para que los usuarios administren la contabilidad de múltiples compañías.
*   **Seguridad:** Autenticación y gestión de perfiles de usuario a través de Supabase Auth.
*   **Reportes:** Generación de balances, estados de resultado y certificados de remuneración.

## Ejecutar Localmente

**Prerrequisitos:**
*   Node.js
*   Una cuenta de Supabase y un proyecto creado.

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Cristobal22/Contador-Fire.git
    cd Contador-Fire
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las credenciales de tu proyecto de Supabase. Puedes encontrarlas en `Project Settings > API` en tu dashboard de Supabase.
    ```
    VITE_SUPABASE_URL=TU_URL_DE_SUPABASE
    VITE_SUPABASE_ANON_KEY=TU_ANON_KEY_DE_SUPABASE
    ```

4.  **Ejecutar la aplicación en modo de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173`.

## Despliegue

El despliegue a producción se realiza automáticamente a través de **Netlify**. Cada vez que se hace un `push` a la rama `main`, Netlify detecta los cambios, construye el proyecto y lo despliega.
