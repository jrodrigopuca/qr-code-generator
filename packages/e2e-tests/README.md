# QR Code Readability Tests

Tests E2E que verifican que los codigos QR generados sean legibles/escaneables.

**Estos tests NO forman parte del paquete publicado.**

## Que hace

1. Genera un QR con nuestra libreria
2. Lo renderiza a imagen
3. Lo decodifica con jsQR
4. Verifica que el texto decodificado coincida con el original

Si jsQR puede leer el QR, el test pasa. Asi de simple.

## Requisitos

1. Compilar el codigo fuente del proyecto padre:

```bash
cd ..
npm run build
```

2. Instalar dependencias de este directorio:

```bash
cd e2e-tests
npm install
```

## Tests de Comparacion E2E

```bash
# Ejecutar todos los tests E2E
npm test

# Con output verbose (ver cada test)
npm run test:verbose

# Ejecutar mas tests aleatorios
npm run test:random    # 100 tests
node e2e-test.js --count=200

# Usar semilla especifica para reproducibilidad
npm run test:seed      # semilla 12345
node e2e-test.js --seed=42

# Combinacion
node e2e-test.js --count=100 --seed=42 --verbose
```

## Tipos de tests

- **Fixed Data**: Textos fijos en todos los niveles de correccion (L, M, Q, H)
- **Random Data**: Datos aleatorios (alfanumericos y numericos)
- **Edge Cases**: Casos limite (1 caracter, URL, espacios, etc)

## Dependencias

- **jsqr**: Decodificador de QR
- **canvas**: Renderizado de matrices QR para jsQR

## Integracion con CI

```yaml
# GitHub Actions example
- name: Run E2E comparison tests
  run: |
    npm run build
    cd e2e-tests
    npm install
    npm test
```
