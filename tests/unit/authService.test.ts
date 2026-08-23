import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  generateSalt,
  FACTORY_DEMO_ACCOUNTS,
} from "@/lib/auth/authService";

describe("Cryptographic Authentication & PBKDF2 Password Security", () => {
  it("generates 32-character hexadecimal random salts", () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();

    assert.strictEqual(salt1.length, 32);
    assert.strictEqual(salt2.length, 32);
    assert.notStrictEqual(salt1, salt2, "Salts must be cryptographically unique");
  });

  it("produces deterministic SHA-512 hashes for matching password and salt", () => {
    const salt = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
    const pass = "equator2026!";

    const hash1 = hashPassword(pass, salt);
    const hash2 = hashPassword(pass, salt);

    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 128, "SHA-512 hex hash must be 128 characters");
  });

  it("produces completely different hashes for different passwords with same salt", () => {
    const salt = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
    const hashA = hashPassword("password123", salt);
    const hashB = hashPassword("password456", salt);

    assert.notStrictEqual(hashA, hashB);
  });

  it("verifies all four factory RBAC roles are represented in demo accounts", () => {
    const roles = FACTORY_DEMO_ACCOUNTS.map((a) => a.role);
    assert.ok(roles.includes("SUPER_ADMIN"), "Must have SUPER_ADMIN demo account");
    assert.ok(roles.includes("FACTORY_MANAGER"), "Must have FACTORY_MANAGER demo account");
    assert.ok(roles.includes("WAREHOUSE_STAFF"), "Must have WAREHOUSE_STAFF demo account");
    assert.ok(roles.includes("SALES_OPERATOR"), "Must have SALES_OPERATOR demo account");
  });
});
