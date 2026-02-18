# Debug Scripts

Scripts de depuración para verificar el funcionamiento del generador de códigos QR.

**⚠️ Estos scripts NO forman parte del paquete publicado.**

## Requisitos

1. Compilar el código fuente del proyecto padre:

```bash
cd ..
npm run build
```

2. Instalar dependencias de este directorio:

```bash
cd debug-scripts
npm install
```

## Scripts disponibles

| Script       | Descripción                                                    |
| ------------ | -------------------------------------------------------------- |
| `codewords`  | Verifica la codificación de datos numéricos                    |
| `ec`         | Verifica los codewords de corrección de errores (Reed-Solomon) |
| `placement`  | Verifica el algoritmo de colocación zigzag                     |
| `trace`      | Traza completa de la generación de QR                          |
| `format`     | Debug de la información de formato                             |
| `reserved`   | Debug de áreas reservadas                                      |
| `compare`    | Compara con qrcode-generator (librería externa)                |
| `debug`      | Script TypeScript de verificación general                      |
| `decode`     | Prueba de decodificación con jsqr                              |
| `compare:ts` | Comparación TypeScript con matriz de referencia                |

## Uso

```bash
# Desde esta carpeta
npm run codewords

# O directamente
node test-codewords-simple.js
npx tsx test-debug.ts
```

## Dependencias incluidas

Este directorio tiene su propio `package.json` con las dependencias necesarias:

- `qrcode-generator` - Para comparación con implementación de referencia
- `jsqr` - Para pruebas de decodificación
- `canvas` - Para renderizado en Node.js
- `tsx` - Para ejecutar archivos TypeScript

## Notas

- Los archivos `.js` usan `require()` y apuntan a `../dist/`
- Los archivos `.ts` usan imports TypeScript y apuntan a `../src/`
