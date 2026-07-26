# Prompt para generar el logo

Pediste un prompt que no diera algo genérico. Este parte de lo que la app **es**:
un disco de vinilo cuyos surcos son las barras de un ecualizador — que es
exactamente la metáfora que ya usan las gráficas de la app.

## Prompt principal (en inglés, que es como mejor responden estos modelos)

```
Minimalist flat vector app icon. A vinyl record seen straight on, but its inner
grooves morph into four vertical equalizer bars of increasing height, like a
finance bar chart. Deep crimson wine background (#9e1b32), bars and outer ring in
warm cream (#f7f0e4), one single bar in aged gold (#b08334). Small circular
spindle hole at the center. Rounded square canvas, generous padding, perfectly
centered, geometric, two-tone, no gradients, no shadows, no text, no lettering.
Vintage 1970s record sleeve restraint meets modern fintech app icon. Clean sharp
edges, solid fills only, flat design, high contrast, readable at 48 pixels.
```

## Variante A — más financiera, menos disco

```
Minimalist flat vector app icon. Four vertical bars of increasing height forming
a bar chart, enclosed inside a thin perfect circle like a vinyl record ring.
Deep crimson wine background (#9e1b32), bars in warm cream (#f7f0e4), tallest bar
in aged gold (#b08334). Rounded square canvas, centered, geometric, flat, no
gradients, no shadows, no text. Serious fintech icon with a subtle classic rock
undertone. Readable at 48 pixels.
```

## Variante B — la púa

```
Minimalist flat vector app icon. A guitar pick silhouette, and inside it three
horizontal lines of decreasing length like a financial ledger or receipt. Deep
crimson wine (#9e1b32) background, pick in warm cream (#f7f0e4), one line in aged
gold (#b08334). Rounded square canvas, centered, generous padding, geometric,
flat, solid fills, no gradients, no shadows, no text, no lettering. Readable at
48 pixels.
```

## Reglas al generar

- **Sin texto.** Los modelos escriben mal las letras y el icono queda inservible.
  El nombre va aparte, debajo del icono.
- **Cuadrado**, y que quede aire alrededor: Android recorta el icono en círculo
  y si el dibujo llega al borde, se come partes.
- Pide **PNG de 1024×1024** y de ahí salen los tamaños.
- Si sale con degradados o sombras, insiste con `flat design, solid fills only,
  no gradients`.

## Cuando lo tengas

Pásame el archivo y yo genero `icon-192.png`, `icon-512.png` y el `icon.svg`,
y los dejo enganchados en el manifest.

Mientras tanto, la app ya trae un icono provisional en `public/icon.svg` con esa
misma idea (vinilo + ecualizador), hecho a mano en SVG.
