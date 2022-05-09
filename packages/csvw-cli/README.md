# csvwriter

Permite por medio de mensajes en forma de JSON (utilizando
la salida y entrada del programa por consola) modificar
los archivos dentro de la carpeta especificada por
`source`.

## Instalar
```bash
npm install -g csvw-cli
```

## CLI
```bash
csvwriter --help # ayuda de la cli
```

```sh
csvwriter init # crea los archivos de configuración
```

```sh
csvwriter # corre la cli con la configuración local
```

## Configuración
Se recomienda visualizarlo en un editor que entienda
`javascript/typescript`, por ejemplo VSCode, ya que
le permite visualizar el tipado de la configuración
(lo siguiente son los tipos de la configuración,
no el archivo en sí).
```typescript
export interface CSVWConfig {
  // debe ser una carpeta que contenga archivos csv
  source: string

  // es la fila (empezando desde 1) dónde
  // se encuentran los headers del archivo
  // ejemplo de cabecera: ID,Nombre,Nota,Comentario
  headerRowNumber: number

  // la codificación para leer los archivos csv
  enconding?: BufferEncoding

  // Es la descripción de los datos que se van a
  // escribir. Tag es como se accede desde
  // el mensaje que se mandó por consola y column
  // representa el nombre de la columna dónde se va
  // a escribir.
  // Ejemplo:
  // {
  //    "tag": "1234",
  //    "type": "request",
  //    "student": { "id": "3902", "grade": 98 },
  //    "comment": "todo bien"
  // }
  //
  // se traduce a:
  // mappings: [
  //    { tag: ["student", "grade"], column: "Nota" },
  //    { tag: ["comment"], column: "Comentario" }
  // ]
  //
  // la primera entrada (["student", "grade"]) se debe
  // a que para obtener la nota hay que ingresar
  // a student y posteriormente a grade (en el mensaje)
  mappings: { tag: string[], column: string }[]

  // Configuración para la búsqueda
  seekConfig: {
    // al igual que los mappings representa como
    // se obtiene el valor del id desde el mensaje
    tag: string[]

    // la columna que identifica la fila
    column: string

    // se explica adelante
    transform: (target: unknown) => string[]
  }
}
```

La función `transform` de la configuración de búsqueda
sirve para convertir el campo de identificación que
viene en el mensaje a una identificación de fila,
por ejemplo si el mensaje trae `"033"`, pero
en el archivo csv aparece como `"#033"`, la
configuración debería ser:
```javascript
{
    ...
    seekConfig: {
        ...
        transform: (target) => ["#".concat(target)]
    }
}
```
O algo similar. Se permite devolver un listado
de identificaciones ya que una identificación de
mensaje puede apuntar a varias filas, por ejemplo
que el mensaje tenga `"sección": "A"`, como
identificación, como es javascript podría utilizar
cualquier cosa que se pueda programar en este lenguaje,
un ejemplo sería leer un archivo que contenga todos
los carnet de los estudiantes de la sección A y
devolver dicho listado. Tal vez la pregunta que tenga es
¿Por qué no mejor una función que tomara como argumentos
la fila y lo que traiga el mensaje? Y la respuesta
a eso es que internamente este programa crea un
índice conforme se leen la filas, el cuál tiene
la información de "en que archivo está" y "que fila es",
lo que permite evitar iterar cada vez que se vaya
a buscar un estudiante. Traducido a javascript sería
algo como:
```javascript
// Complejidad: O(m*files*rows) dónde m es la cantidad de
// mensajes que se reciben.

// En vez de realizar esto por cada mensaje
files.forEach((file) => {
    const rows = file.manyRows.filter(searchFunction)
    // ...
})

// Complejidad: O(m) dónde m es la cantidad de
// mensaje que se reciben.

// Se hace esto
const indexEntry = index[rowId]
const file = cache.files[indexEntry.file]
const row = file.rows[indexEntry.index]
// Nota: esto se haría por cada identificación
// que devuelva la función transform
```
Claro que sólo vale la pena si realmente son varios
archivos o tiene muchas filas xD (fue más por salud mental).

## Formato de la petición
```json
{
    "tag": "<identifica la comunicación>",
    "type": "request", // sólo este valor se acepta
    "dato del usuario": "...",
    "un dato anidado": {
        "dato interno": 1
    }
}
```

## Formato de respuesta
### OK!
```json
{
    "tag": "<se devuelve el mismo tag>",
    "type": "response",
    "status": "ok"
}
```
### Error
```json
{
    "tag": "<se devuelve el mismo tag>",
    "type": "error",
    "status": "not found",
    "missings": ["csv_row_id1", "csv_row_id2", ...]
}
```

