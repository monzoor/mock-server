import { faker } from '@faker-js/faker';
import { monFactory } from '../monFactory.js';

monFactory.create(
  {
    _key: "contacts",
    _repeat: 30,
  },
  () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    isActive: faker.datatype.boolean(), 
  })
);
