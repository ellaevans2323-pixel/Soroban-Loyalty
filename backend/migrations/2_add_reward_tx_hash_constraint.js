/* eslint-disable camelcase */
"use strict";

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.addColumn("rewards", {
    tx_hash: { type: "varchar(64)" },
  });

  pgm.addConstraint("rewards", "rewards_tx_hash_unique", {
    unique: ["tx_hash"],
  });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropConstraint("rewards", "rewards_tx_hash_unique");
  pgm.dropColumn("rewards", "tx_hash");
};
