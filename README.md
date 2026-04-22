# GUBO Maquinaria Forestal - Web

Esta es una aplicación web estática impulsada por datos en formato YAML. El frontend lee los archivos de configuración y contenido para renderizar las diferentes secciones de forma dinámica.

## Desarrollo Local

Debido a que la web carga archivos de datos (YAML) de forma dinámica mediante peticiones de red (Fetch API), la mayoría de los navegadores modernos bloquearán estas peticiones si intentas abrir el archivo `index.html` directamente (usando el protocolo `file://`) por razones de seguridad (CORS).

Para previsualizar la web correctamente, debes servirla a través de un servidor local.

### Cómo servir la web con Python

Si tienes Python instalado (viene por defecto en macOS y la mayoría de Linux), ejecuta el siguiente comando en la raíz del proyecto:

```bash
python3 -m http.server 8000
```

Luego, abre tu navegador en: [http://localhost:8000](http://localhost:8000)

## Cómo añadir o modificar contenido

La web está diseñada para ser gestionada casi exclusivamente a través de los archivos en la carpeta `data/`.

### 1. Modificar textos e imágenes
Casi toda la información visible se encuentra en archivos YAML dentro de `data/`:
- `home.yaml`: Contenido de la página de inicio.
- `about.yaml`: Información sobre la empresa.
- `contact.yaml`: Datos de contacto y redes sociales.
- `gallery.yaml`: Imágenes de la galería.
- `products.yaml`: Listado de maquinaria principal.
- `spareparts.yaml`: Listado de recambios (nombres, referencias y compatibilidad).

### 2. Añadir nuevos Productos o Recambios
- **Productos**: Crea un nuevo archivo `.yaml` en `data/` (ej. `product_90.yaml`) siguiendo el esquema de los existentes y añádelo al array `items` en `data/products.yaml`.
- **Recambios**: Simplemente añade una nueva entrada al array `items` en `data/spareparts.yaml`.

### 3. Configuración del Sitio y Navegación
El archivo `data/config.yaml` controla los aspectos globales:
- Nombre del sitio.
- Enlaces de la barra de navegación (puedes añadir o quitar secciones aquí).
- Textos de los botones comunes.

### 4. Recursos Visuales
Guarda las imágenes en las subcarpetas correspondientes dentro de `assets/images/` y asegúrate de que las rutas en los archivos YAML coincidan (ej. `assets/images/spareparts/mi_pieza.png`).

---

*Desarrollado por el equipo de GUBO Maquinaria.*
