/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * Tag that allows expressions to be used in localized non-HTML template
 * strings.
 *
 * Example: msg(str`Hello ${this.user}!`);
 *
 * The Lit html tag can also be used for this purpose, but HTML will need to be
 * escaped, and there is a small overhead for HTML parsing.
 *
 * Untagged template strings with expressions aren't supported by lit-localize
 * because they don't allow for values to be captured at runtime.
 */
const _str = (strings, ...values) => ({
    strTag: true,
    strings,
    values,
});
const str = _str;

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class Deferred {
    constructor() {
        this.settled = false;
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    resolve(value) {
        this.settled = true;
        this._resolve(value);
    }
    reject(error) {
        this.settled = true;
        this._reject(error);
    }
}

/**
 * @license
 * Copyright 2014 Travis Webb
 * SPDX-License-Identifier: MIT
 */
// This module is derived from the file:
// https://github.com/tjwebb/fnv-plus/blob/1e2ce68a07cb7dd4c3c85364f3d8d96c95919474/index.js#L309
//
// Changes:
// - Only the _hash64_1a_fast function is included.
// - Removed loop unrolling.
// - Converted to TypeScript ES module.
// - var -> let/const
//
// TODO(aomarks) Upstream improvements to https://github.com/tjwebb/fnv-plus/.
for (let i = 0; i < 256; i++) {
    ((i >> 4) & 15).toString(16) + (i & 15).toString(16);
}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let loading = new Deferred();
// The loading promise must be initially resolved, because that's what we should
// return if the user immediately calls setLocale(sourceLocale).
loading.resolve();

// Do not modify this file by hand!
// Re-generate this file by running lit-localize
/* eslint-disable no-irregular-whitespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
const templates = {
    's44851a8adf059eef': `Angeheftet`,
    's5d929ff1619ac0c9': `Suche`,
    's6d8c02aee480af7a': `Menü`,
    's7293d04c5979a8ad': `Seitenleiste ausklappen`,
    's7417792bbe720149': `Wiederholen`,
    's8f10b4e57121e256': `Seitenleiste einklappen`,
    's8f4be9f086eb530f': `Rückgängig`,
    'sd1fdd3cc8714d686': str `${0} anheften`,
    'sf8256ec799969cb7': str `${0} lösen`,
    's3e2b2947e76caf9c': `Items you pin will appear here`,
    's5f4586bc1e2740e6': `Clear search`,
};

export { templates };
//# sourceMappingURL=de.js.map
