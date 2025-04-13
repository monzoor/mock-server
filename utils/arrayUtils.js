/**
 * Array utility functions for mock data generation.
 * This module provides helper functions to create and manipulate arrays
 * that are commonly needed when generating mock data structures.
 */

/**
 * Creates an array of specified length and maps each element using the provided function
 * @param {number} length - Length of the array to create
 * @param {Function} mapFn - Function to map each array element
 * @returns {Array} Mapped array
 * @throws {Error} If length is negative
 */
export const createAndMapArray = (length, mapFn) => {
  if (length < 0) {
    throw new Error(`Array length cannot be negative (received ${length})`);
  }
  return Array.from({ length }).map(mapFn);
};
