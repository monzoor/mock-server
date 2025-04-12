# Mon Factory

Mon Factory is a mock data generation tool that creates JSON files based on templates and merges them into a single database file for use with `json-server`.

## How to Run the Project

1. **Install Dependencies**  
   Run the following command to install the required dependencies:

   ```bash
   yarn install
   ```

2. **Generate Mock Data and Start the Server**  
   To generate mock data and start the JSON server, run:

   ```bash
   yarn run start:json-server
   ```

   This will:

   - Execute all factory files in the `factory` folder.
   - Remove extra database files in the `db` folder.
   - Merge all JSON files into a single `db.json` file.
   - Start the JSON server on port `3000`.

3. **Watch for Changes**  
   To watch for changes and automatically update the server, run:
   ```bash
   yarn run watch:json-server
   ```

## How to Use `monFactory`

`monFactory` is used to create mock data based on a template. It generates JSON files in the `db` folder.

### Example Usage

Here is an example of how to use `monFactory` in a factory file:

```js
import { faker } from "@faker-js/faker";
import { monFactory } from "../monFactory.js";

monFactory.create({
  _key: "example",
  _template: {
    id: faker.number.int(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    _repeat: 5,
  },
});
```

This will generate a file named `example.json` in the `db` folder with 5 entries.

## Definitions

### `_key`

- **Type**: `string`
- **Description**: The name of the JSON file to be created in the `db` folder. It must be a non-empty string.

### `_template`

- **Type**: `object`
- **Description**: The structure of the mock data to be generated. It supports nested objects and arrays.
- **Special Fields**:
  - `_repeat`: Specifies the number of times the template should be repeated. Must be a positive number.

#### Meaning of `_repeat`:

- **With `_repeat`**: The template will be repeated the specified number of times, generating multiple entries.
- **Without `_repeat`**: The template will be processed only once, generating a single entry.

### Example Template

```js
import { monFactory } from "../monFactory.js";

monFactory.create({
  _key: "company",
  _template: {
    id: faker.number.int(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    address: faker.location.streetAddress(),
    job: {
      title: faker.person.jobTitle(),
      id: faker.number.int(),
      company: {
        name: faker.company.name(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
        },
      },
      _repeat: 4,
    },
    _repeat: 4,
  },
});
```

This template will generate 10 entries with the specified structure.

## Notes

- All factory files should be placed in the `factory` folder.
- The generated JSON files are stored in the `db` folder.
- The merged database file is `db.json`.
