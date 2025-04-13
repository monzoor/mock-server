# Mock Server with monFactory

A flexible mock data generation system that leverages [json-server](https://www.npmjs.com/package/json-server) to create a fully functional mock REST API with zero coding.

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd mock-server

# Install dependencies
npm install
# or
yarn install
```

## Running the Server

```bash
# Generate mock data and start the server
npm run start:json-server
# or
yarn start:json-server

# Watch mode - automatically regenerate when factory files change
npm run watch:factory
# or
yarn watch:factory
```

## How to Create Factory Files

Factory files are the blueprint for your mock data. Each factory file creates a specific data type that will be available through the API.

### Basic Factory Structure

Create a new JavaScript file in the `factory` directory with the following structure:

```javascript
import { faker } from "@faker-js/faker";
import { monFactory } from "../monFactory.js";

monFactory.create(
  {
    _key: "entityName", // This will be the endpoint name in your API
    _repeat: 10, // Optional: number of items to create
  },
  () => ({
    // Your entity structure with faker data
    id: faker.number.int(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    // Add more properties as needed
  })
);
```

### The `_repeat` Option

The `_repeat` option controls how many instances of your entity will be created:

- **Without `_repeat`**: Creates a single object

  ```javascript
  monFactory.create({ _key: "profile" }, () => ({
    name: faker.person.fullName(),
    bio: faker.lorem.paragraph(),
  }));
  // Result: { "profile": { "id": 1, "name": "...", "bio": "..." } }
  ```

- **With `_repeat`**: Creates an array of objects
  ```javascript
  monFactory.create({ _key: "users", _repeat: 3 }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }));
  // Result: { "users": [{ "id": 1, "name": "...", "email": "..." }, ...] }
  ```

### Examples

#### Without createAndMapArray

When you need simple properties without nested arrays:

```javascript
import { faker } from "@faker-js/faker";
import { monFactory } from "../monFactory.js";

monFactory.create(
  {
    _key: "products",
    _repeat: 5,
  },
  () => ({
    name: faker.commerce.productName(),
    price: faker.commerce.price(),
    department: faker.commerce.department(),
    description: faker.commerce.productDescription(),
    material: faker.commerce.productMaterial(),
  })
);
```

#### With createAndMapArray

When you need nested arrays of related data:

```javascript
import { faker } from "@faker-js/faker";
import { monFactory } from "../monFactory.js";
import { createAndMapArray } from "../utils/arrayUtils.js";

monFactory.create(
  {
    _key: "authors",
    _repeat: 3,
  },
  () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    bio: faker.lorem.paragraph(),
    books: createAndMapArray(4, () => ({
      title: faker.lorem.words(3),
      publishYear: faker.date.past().getFullYear(),
      genre: faker.word.sample(),
      sales: faker.number.int({ min: 100, max: 10000 }),
    })),
  })
);
```

## JSON Server Integration

This project uses [json-server](https://www.npmjs.com/package/json-server) to create a RESTful API from the generated mock data.

### Key Features

- **Full REST API**: All standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
- **Filters**: Filter data using query parameters (`/users?name=John`)
- **Pagination**: Paginate results with `_page` and `_limit` (`/users?_page=1&_limit=10`)
- **Sorting**: Sort by fields (`/users?_sort=name&_order=asc`)
- **Slice**: Get a subset of results (`/users?_start=10&_end=20`)
- **Operators**: Use operators for comparisons (`/users?age_gte=18&age_lte=65`)
- **Full-text search**: Search all fields (`/users?q=John`)
- **Relationships**: Access nested resources (`/authors/1/books`)
- **Routes**: Define custom routes in `routes.json`

### Example API Requests

After starting the server, you can make requests like:

```
GET    /companyItems          # Get all company items
GET    /companyItems/1        # Get company item with id=1
POST   /companyItems          # Create a new company item
PUT    /companyItems/1        # Replace company item with id=1
PATCH  /companyItems/1        # Partially update company item with id=1
DELETE /companyItems/1        # Delete company item with id=1
```

### Advanced Configuration

For advanced configuration, you can create a `json-server.json` file:

```json
{
  "port": 3000,
  "host": "0.0.0.0",
  "watch": true,
  "delay": 1000,
  "routes": "routes.json"
}
```

For more information, visit the [json-server documentation](https://github.com/typicode/json-server).

## Project Structure

```
mock-server/
├── core/              # Core functionality
├── db/                # Generated individual JSON files
├── factory/           # Factory definitions
├── utils/             # Utility functions
├── db.json            # Final merged JSON file (generated)
├── monFactory.js      # Factory system main file
├── package.json       # Project configuration
├── README.md          # This file
└── runner.js          # Runner script
```
