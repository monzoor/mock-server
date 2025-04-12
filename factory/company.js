import { faker } from '@faker-js/faker';
import { monFactory } from '../monFactory.js';

monFactory.create({
  _key: 'company',
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
    },
    _repeat: 4,
  },
});
