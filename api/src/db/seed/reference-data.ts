/**
 * Fixed reference data for generating realistic seed employees.
 *
 * Exchange rates are an approximate, dated snapshot (see requirements: no live FX).
 * `payLevel` scales the US salary range to the local market (US = 1.0). Values are illustrative.
 */

export const EXCHANGE_RATES_AS_OF = '2026-11-01';

export interface SeedCountry {
  code: string;
  name: string;
  currency: string;
  /** Value of 1 unit of the local currency in USD. */
  usdRate: number;
  payLevel: number;
  /** Relative share of headcount. */
  weight: number;
  firstNames: readonly string[];
  lastNames: readonly string[];
}

// Kept as compact data tables for readability.
// prettier-ignore
export const SEED_COUNTRIES: readonly SeedCountry[] = [
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    usdRate: 1,
    payLevel: 1,
    weight: 30,
    firstNames: ['James', 'Mary', 'Michael', 'Jennifer', 'David', 'Linda', 'Robert', 'Emily', 'Daniel', 'Sarah', 'Chris', 'Jessica'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore'],
  },
  {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    usdRate: 0.0114,
    payLevel: 0.28,
    weight: 25,
    firstNames: ['Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Arjun', 'Kavya', 'Rahul', 'Neha', 'Karan', 'Pooja'],
    lastNames: ['Sharma', 'Patel', 'Gupta', 'Singh', 'Reddy', 'Iyer', 'Nair', 'Mehta', 'Joshi', 'Rao', 'Verma', 'Kapoor'],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    usdRate: 1.33,
    payLevel: 0.75,
    weight: 10,
    firstNames: ['Oliver', 'Amelia', 'George', 'Isla', 'Harry', 'Ava', 'Jack', 'Grace', 'Charlie', 'Sophie', 'Thomas', 'Lily'],
    lastNames: ['Clarke', 'Evans', 'Hughes', 'Wright', 'Walker', 'Green', 'Hall', 'Wood', 'Turner', 'Baker', 'Hill', 'Cooper'],
  },
  {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    usdRate: 1.16,
    payLevel: 0.8,
    weight: 8,
    firstNames: ['Lukas', 'Anna', 'Felix', 'Lena', 'Jonas', 'Laura', 'Paul', 'Marie', 'Leon', 'Julia', 'Max', 'Sophia'],
    lastNames: ['Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Neumann'],
  },
  {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    usdRate: 0.72,
    payLevel: 0.8,
    weight: 7,
    firstNames: ['Liam', 'Olivia', 'Noah', 'Emma', 'Ethan', 'Chloe', 'Lucas', 'Charlotte', 'Benjamin', 'Abigail', 'Owen', 'Hannah'],
    lastNames: ['Tremblay', 'Gagnon', 'Roy', 'Cote', 'Bouchard', 'Gauthier', 'Morin', 'Lavoie', 'Fortin', 'Martin', 'Campbell', 'Stewart'],
  },
  {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    usdRate: 0.66,
    payLevel: 0.8,
    weight: 5,
    firstNames: ['Jack', 'Charlotte', 'William', 'Mia', 'Henry', 'Matilda', 'Lachlan', 'Ruby', 'Cooper', 'Zoe', 'Riley', 'Ella'],
    lastNames: ['Kelly', 'Ryan', 'Murphy', 'Mitchell', 'Harris', 'King', 'Lee', 'Young', 'Scott', 'Morris', 'Ward', 'Bell'],
  },
  {
    code: 'SG',
    name: 'Singapore',
    currency: 'SGD',
    usdRate: 0.77,
    payLevel: 0.75,
    weight: 5,
    firstNames: ['Wei', 'Hui Min', 'Jun Jie', 'Xin Yi', 'Darren', 'Rachel', 'Marcus', 'Clara', 'Ryan', 'Natalie', 'Ethan', 'Jasmine'],
    lastNames: ['Tan', 'Lim', 'Lee', 'Ng', 'Ong', 'Wong', 'Goh', 'Chua', 'Chan', 'Koh', 'Teo', 'Ang'],
  },
  {
    code: 'BR',
    name: 'Brazil',
    currency: 'BRL',
    usdRate: 0.185,
    payLevel: 0.35,
    weight: 10,
    firstNames: ['Joao', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Juliana', 'Gabriel', 'Fernanda', 'Rafael', 'Camila', 'Bruno', 'Beatriz'],
    lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Carvalho', 'Ribeiro', 'Gomes'],
  },
];

export interface SeedRole {
  jobTitle: string;
  department: string;
  /** Annual salary range in the US market, in USD. */
  minUsd: number;
  maxUsd: number;
  /** Relative share of headcount. */
  weight: number;
}

// prettier-ignore
export const SEED_ROLES: readonly SeedRole[] = [
  { jobTitle: 'Software Engineer', department: 'Engineering', minUsd: 90_000, maxUsd: 140_000, weight: 18 },
  { jobTitle: 'Senior Software Engineer', department: 'Engineering', minUsd: 130_000, maxUsd: 190_000, weight: 10 },
  { jobTitle: 'Engineering Manager', department: 'Engineering', minUsd: 170_000, maxUsd: 240_000, weight: 3 },
  { jobTitle: 'QA Engineer', department: 'Engineering', minUsd: 70_000, maxUsd: 110_000, weight: 6 },
  { jobTitle: 'DevOps Engineer', department: 'Engineering', minUsd: 100_000, maxUsd: 160_000, weight: 4 },
  { jobTitle: 'Product Manager', department: 'Product', minUsd: 110_000, maxUsd: 170_000, weight: 4 },
  { jobTitle: 'Product Designer', department: 'Product', minUsd: 85_000, maxUsd: 135_000, weight: 3 },
  { jobTitle: 'Sales Representative', department: 'Sales', minUsd: 55_000, maxUsd: 90_000, weight: 9 },
  { jobTitle: 'Account Executive', department: 'Sales', minUsd: 80_000, maxUsd: 140_000, weight: 5 },
  { jobTitle: 'Sales Manager', department: 'Sales', minUsd: 110_000, maxUsd: 170_000, weight: 2 },
  { jobTitle: 'Marketing Specialist', department: 'Marketing', minUsd: 55_000, maxUsd: 85_000, weight: 4 },
  { jobTitle: 'Marketing Manager', department: 'Marketing', minUsd: 95_000, maxUsd: 150_000, weight: 2 },
  { jobTitle: 'Accountant', department: 'Finance', minUsd: 55_000, maxUsd: 85_000, weight: 3 },
  { jobTitle: 'Financial Analyst', department: 'Finance', minUsd: 70_000, maxUsd: 110_000, weight: 3 },
  { jobTitle: 'Finance Manager', department: 'Finance', minUsd: 110_000, maxUsd: 160_000, weight: 1 },
  { jobTitle: 'Recruiter', department: 'Human Resources', minUsd: 60_000, maxUsd: 95_000, weight: 2 },
  { jobTitle: 'HR Generalist', department: 'Human Resources', minUsd: 55_000, maxUsd: 85_000, weight: 2 },
  { jobTitle: 'HR Manager', department: 'Human Resources', minUsd: 90_000, maxUsd: 140_000, weight: 1 },
  { jobTitle: 'Customer Support Specialist', department: 'Operations', minUsd: 40_000, maxUsd: 65_000, weight: 10 },
  { jobTitle: 'Operations Analyst', department: 'Operations', minUsd: 60_000, maxUsd: 95_000, weight: 3 },
  { jobTitle: 'Operations Manager', department: 'Operations', minUsd: 95_000, maxUsd: 145_000, weight: 1 },
];
