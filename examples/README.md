# Ejemplos de QR Code Generator

Esta carpeta contiene ejemplos funcionales de cómo usar la librería.

## Ejemplo Browser

Una demo interactiva con Vite que permite generar códigos QR en el navegador.

```bash
npm run example:browser
```

Luego abrir http://localhost:5173 en el navegador.

**Características:**

- Generación en tiempo real mientras escribes
- Selector de nivel de corrección de errores
- Renderizado en Canvas o SVG
- Colores personalizables
- Descarga como PNG o SVG
- Muestra información del QR (versión, modo, tamaño, máscara)

## Ejemplo Node.js

Script de demostración que muestra las principales funcionalidades.

```bash
npm run example:node
```

**Demuestra:**

1. Generación simple con `generateQR()`
2. Detección automática de modo (numérico, alfanumérico, byte)
3. Configuración avanzada con opciones
4. Generación y guardado de SVG
5. Comparación de niveles de corrección
6. Acceso directo a la matriz binaria

## Ejecutar sin instalar dependencias globales

Ambos ejemplos usan TypeScript directamente desde `src/` sin necesidad de compilar a `dist/`:

- **Browser**: Vite transpila TypeScript automáticamente
- **Node.js**: tsx ejecuta TypeScript directamente

## Archivos generados

- `node/output.svg` - SVG generado por el ejemplo de Node.js
