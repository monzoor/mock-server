import { faker } from '@faker-js/faker';
import { monFactory } from '../monFactory.js';
import { createAndMapArray } from '../utils/arrayUtils.js';

monFactory.create(
  {
    _key: "companyItems",
    _repeat: 51,
  },
  () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    address: faker.location.streetAddress(),
    jobs: createAndMapArray(5, () => ({
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
    })),
  })
);
