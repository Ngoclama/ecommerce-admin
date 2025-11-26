// eslint.config.mjs

import next from "eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [...tseslint.configs.recommended, next.configs.recommended];
