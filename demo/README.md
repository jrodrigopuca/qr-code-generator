# Demos de QR Code Generator

Esta carpeta contiene demos funcionales de cómo usar la librería.

## Demo Browser

Una demo interactiva con Vite que permite generar códigos QR en el navegador.

```bash
npm run demo:browser
```

Luego abrir http://localhost:5173 en el navegador.

**Características:**

- Generación en tiempo real mientras escribes
- Selector de nivel de corrección de errores
- Renderizado en Canvas o SVG
- Colores personalizables
- Descarga como PNG o SVG
- Muestra información del QR (versión, modo, tamaño, máscara)

## Demo Node.js

Script de demostración que muestra las principales funcionalidades.

```bash
npm run demo:node
```

**Demuestra:**

1. Generación simple con `generateQR()`
2. Detección automática de modo (numérico, alfanumérico, byte)
3. Configuración avanzada con opciones
4. Generación y guardado de SVG
5. Comparación de niveles de corrección
6. Acceso directo a la matriz binaria
7. Renderizado en terminal (Unicode, Compacto, ASCII, Invertido)

## Ejecutar sin instalar dependencias globales

Ambas demos usan TypeScript directamente desde `src/` sin necesidad de compilar a `dist/`:

- **Browser**: Vite transpila TypeScript automáticamente
- **Node.js**: tsx ejecuta TypeScript directamente

## Archivos generados

- `node/output.svg` - SVG generado por la demo de Node.js
