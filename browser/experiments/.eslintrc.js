"use strict";

module.exports = {
  "rules": {
    "no-unused-vars": ["error", {
      "args": "none",
      "vars": "all",
      "varsIgnorePattern": "^EXPORTED_SYMBOLS$",
    }]
  }
};
