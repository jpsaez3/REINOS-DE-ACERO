# Reinos de Acero

Prototipo de la **Fase 1** de un RPG táctico medieval para un jugador. Interfaz en español, cuatro aventureros, seis razas y seis clases combinables sin restricciones. Un encuentro completo en el Paso Ceniza contra un combatiente, una arquera y un hechicero.

## Instalación y ejecución

Requisitos: Node.js 22.12 o superior (validado con 24.19) y npm.

```sh
npm ci
npm run dev
```

Desde la raíz del repositorio. Abre la dirección que indique Vite en tu navegador de escritorio. No requiere cuenta, claves ni servicios externos.

```sh
npm test          # pruebas del motor, incluida victoria y derrota completas
npm run build    # comprobación TypeScript y compilación de producción
npm run test:e2e # Chromium instalado en /usr/bin/chromium; Vite debe estar en puerto 5173
```

`npm run test:e2e` crea un grupo, mueve y ataca mediante controles visibles hasta la victoria, recarga y recupera la partida, comprueba errores del navegador y genera capturas en `/tmp`. La semilla de juego normal varía en cada encuentro; las pruebas del motor y la partida de navegador usan semillas fijas. Para otro Chromium, usa la variable no secreta `CHROMIUM_PATH`.

## Cómo jugar

1. Nueva partida: asigna nombre, raza, clase y atributos a cada integrante. Puedes repetir clases. Cambiar de clase restablece su distribución recomendada. No es necesario gastar todos los puntos.
2. Entra al paso. Las fichas superiores muestran iniciativa, vida y turno activo. Puedes consultar cualquier ficha desde ellas.
3. En tu turno, pulsa una casilla verde para moverte. Selecciona ataque o habilidad y pulsa un objetivo. Los movimientos consumen distancia real del camino, no distancia directa.
4. Las habilidades personales se activan al pulsar su botón. Las demás necesitan un objetivo. Los botones y las casillas explican restricciones al pasar el cursor.
5. Finaliza el turno para continuar. Los enemigos actúan automáticamente. Click derecho en una ficha del mapa abre sus estadísticas.
6. Elimina a los tres enemigos para ganar. Si caen los cuatro aventureros, pierdes.

**Consejos:** el guerrero puede cerrar el paso central y proteger a un aliado adyacente; combina bendición y protección. Un disparo de sujeción prepara el golpe oportunista del pícaro. La escarcha reduce la movilidad enemiga y el centinela es vulnerable al frío. Las coberturas protegen a los atacantes de retaguardia.

## Guardado

Se guarda automáticamente después de cada cambio, incluidos turnos enemigos y el resultado final, en `localStorage` (`reinos-acero-v1`). Continuar recupera orden, estados, recursos, generador aleatorio y posiciones. Solo existe una ranura por navegador; una nueva expedición reemplaza la anterior al entrar en combate. Configuración de velocidad es temporal. No se transfieren partidas entre navegadores ni se recuperan datos borrados por el usuario.

## Organización

- `src/content.ts`: razas, clases, habilidades y progresión mediante datos.
- `src/engine.ts`: reglas, tablero, caminos, visibilidad, resolución, IA y serialización; sin React ni DOM.
- `src/main.tsx`: menú, creación, combate, configuración y ficha.
- `src/style.css`: diseño adaptable; símbolos y fuentes locales, sin recursos externos.
- `src/engine.test.ts`: pruebas de reglas y simulaciones completas.
- `e2e/play.mjs`: partida real en Chromium mediante Playwright.
- [REGLAS.md](REGLAS.md): reglamento completo del prototipo.
- [ARQUITECTURA.md](ARQUITECTURA.md): módulos y ampliación.

## Alcance actual

Un tablero, tres enemigos, una habilidad distintiva por clase más ataque básico y poción; aliento adicional dracónico. Renderizado con cuadrícula DOM/CSS en React: permite foco, tooltips y pruebas de interacción sin acoplar el motor a Phaser. Sin alturas, exploración, campaña, diálogos, tienda, editor de equipo ni creación de mapas. Los equipos de clase son fijos; pociones son consumibles funcionales. Hay estructura de nivel 1–5 y un ascenso a nivel 2 tras ganar; no hay cinco niveles de contenido. No implementa el reglamento completo de D&D.
