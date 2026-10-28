// Pure-JS port of edge-tts 7.3.1 DRM token (Sec-MS-GEC v2), byte-for-byte verified
// against the Python reference. The round function is NOT textbook SHA-256: the
// initial-state path pre-runs two canonical rounds and then enters an unrolled
// 8-round block whose register read/write pattern does not assume canonical
// bindings. Fidelity to that control flow is what makes the token match.
const WIN_EPOCH = 11644473600;
const TRUSTED = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const M = 0xFFFFFFFF;

const SHA256_INITIAL = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
const SHA256_STATE = [0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A, 0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2];
const SHA256_SCHEDULE = [0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA, 0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6, 0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33, 0xD258B060, 0x72766564];
const RC = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
];
const ADJ = 0xC9DC06A7;
const SIGMA0_ADJ = 0x059C0B80;
const SIGMA1_ADJ = 0x000B92C0;

const S1 = (v) => (((v >>> 6) | (v << 26)) ^ ((v >>> 11) | (v << 21)) ^ ((v >>> 25) | (v << 7))) >>> 0;
const S0 = (v) => (((v >>> 2) | (v << 30)) ^ ((v >>> 13) | (v << 19)) ^ ((v >>> 22) | (v << 10))) >>> 0;
const sigma0 = (v) => (((v >>> 7) ^ (v << 25) ^ (v >>> 18) ^ (v << 14) ^ (v >>> 3)) >>> 0);
const sigma1 = (v) => (((v >>> 17) ^ (v << 15) ^ (v >>> 19) ^ (v << 13) ^ (v >>> 10)) >>> 0);

function sha256Rounds(state, words, firstRound) {
  let a = state[0], b = state[1], c = state[2], d = state[3];
  let e = state[4], f = state[5], g = state[6], h = state[7];
  const constants = firstRound === 14
    ? RC.slice(0, 14).concat([ADJ], RC.slice(15))
    : RC;
  const aligned = Math.min(64, (((firstRound + 7) / 8) | 0) * 8);
  // Canonical rounds first (only ever 0 or 2 of them in practice).
  for (let i = firstRound; i < aligned; i++) {
    const t1 = (h + S1(e) + (g ^ (e & (f ^ g))) + constants[i] + words[i]) >>> 0;
    const t2 = (S0(a) + ((a & b) | (c & (a | b)))) >>> 0;
    h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
  }
  // Unrolled 8-round block, transcribed literally: each sub-round reads and
  // writes the *current* bindings rather than a rotated tuple.
  for (let i = aligned; i < 64; i += 8) {
    let t1;
    t1 = (h + S1(e) + (g ^ (e & (f ^ g))) + constants[i] + words[i]) >>> 0;
    d = (d + t1) >>> 0;
    h = (t1 + S0(a) + ((a & b) | (c & (a | b)))) >>> 0;
    t1 = (g + S1(d) + (f ^ (d & (e ^ f))) + constants[i + 1] + words[i + 1]) >>> 0;
    c = (c + t1) >>> 0;
    g = (t1 + S0(h) + ((h & a) | (b & (h | a)))) >>> 0;
    t1 = (f + S1(c) + (e ^ (c & (d ^ e))) + constants[i + 2] + words[i + 2]) >>> 0;
    b = (b + t1) >>> 0;
    f = (t1 + S0(g) + ((g & h) | (a & (g | h)))) >>> 0;
    t1 = (e + S1(b) + (d ^ (b & (c ^ d))) + constants[i + 3] + words[i + 3]) >>> 0;
    a = (a + t1) >>> 0;
    e = (t1 + S0(f) + ((f & g) | (h & (f | g)))) >>> 0;
    t1 = (d + S1(a) + (c ^ (a & (b ^ c))) + constants[i + 4] + words[i + 4]) >>> 0;
    h = (h + t1) >>> 0;
    d = (t1 + S0(e) + ((e & f) | (g & (e | f)))) >>> 0;
    t1 = (c + S1(h) + (b ^ (h & (a ^ b))) + constants[i + 5] + words[i + 5]) >>> 0;
    g = (g + t1) >>> 0;
    c = (t1 + S0(d) + ((d & e) | (f & (d | e)))) >>> 0;
    t1 = (b + S1(g) + (a ^ (g & (h ^ a))) + constants[i + 6] + words[i + 6]) >>> 0;
    f = (f + t1) >>> 0;
    b = (t1 + S0(c) + ((c & d) | (e & (c | d)))) >>> 0;
    t1 = (a + S1(f) + (h ^ (f & (g ^ h))) + constants[i + 7] + words[i + 7]) >>> 0;
    e = (e + t1) >>> 0;
    a = (t1 + S0(b) + ((b & c) | (d & (b | c)))) >>> 0;
  }
  return [a, b, c, d, e, f, g, h];
}

function expandSchedule(words, firstWord) {
  for (let i = firstWord; i < 64; i++) {
    const x = words[i - 2], y = words[i - 15];
    words.push((sigma1(x) + words[i - 7] + sigma0(y) + words[i - 16]) >>> 0);
  }
}

const initCache = new Map();
function sha256Init(data7) {
  const key = Buffer.from(data7).toString('hex');
  const hit = initCache.get(key);
  if (hit) return hit;
  const words = new Array(14).fill(0);
  words.push(((data7[0] << 16) | (data7[1] << 8) | data7[2]) >>> 0);
  words.push(((data7[3] << 24) | (data7[4] << 16) | (data7[5] << 8) | data7[6]) >>> 0);
  for (let i = 16; i < 30; i++) {
    let value = SHA256_SCHEDULE[i - 16];
    if (i - 2 >= 14) {
      value = (value + (i === 16 ? (sigma1(words[i - 2]) ^ SIGMA1_ADJ) : sigma1(words[i - 2]))) >>> 0;
    }
    if (i - 7 >= 14) value = (value + words[i - 7]) >>> 0;
    if (i - 15 >= 14) {
      value = (value + (i === 29 ? (sigma0(words[i - 15]) ^ SIGMA0_ADJ) : sigma0(words[i - 15]))) >>> 0;
    }
    words.push(value >>> 0);
  }
  words.push((sigma1(words[28]) + words[23] + sigma0(words[15]) + words[14] + ADJ - RC[14]) >>> 0);
  expandSchedule(words, 31);
  const working = sha256Rounds(SHA256_STATE, words, 14);
  const out = SHA256_INITIAL.map((v, i) => (v + working[i]) >>> 0);
  initCache.set(key, out);
  return out;
}

export function sha256Digest(data) {
  const buf = Buffer.from(data);
  if (buf.length < 7) throw new Error('token salt must contain at least seven bytes');
  const length = 57 + buf.length;
  const padLen = (((55 - length) % 64) + 64) % 64;
  const tail = Buffer.alloc(8);
  tail.writeUInt32BE(0, 0);
  tail.writeUInt32BE((length * 8) >>> 0, 4);
  const padded = Buffer.concat([buf.subarray(7), Buffer.from([0x80]), Buffer.alloc(padLen), tail]);
  let state = sha256Init([...buf.subarray(0, 7)]);
  for (let off = 0; off < padded.length; off += 64) {
    const words = [];
    for (let i = 0; i < 16; i++) words.push(padded.readUInt32BE(off + i * 4));
    expandSchedule(words, 16);
    const working = sha256Rounds(state, words, 0);
    state = state.map((v, i) => (v + working[i]) >>> 0);
  }
  const out = Buffer.alloc(32);
  state.forEach((v, i) => out.writeUInt32BE(v, i * 4));
  return out;
}

const CS64_COEFFICIENTS = [
  [0xE82E91B1, 0xB32700D0], [0x44DE24C6, 0x88DFF51D], [0x3BEB65BC, 0x29514038], [0xC89C5933, 0xB328CBDF],
  [0x8D1EC211, 0xD405B4D5], [0x314EF5D5, 0x26E55F3C], [0xE92491B1, 0x607801C6], [0xF0A5B9D5, 0x82B2C1FB],
  [0x06064CF3, 0xFA51A3DA], [0xDA79FA60, 0x207CC464], [0xBED20560, 0x3C3C74F3], [0x89F9C9F8, 0xD2D14B61],
  [0x35FA38C6, 0xBB04A2C1], [0xCB49E3C6, 0xC5626167],
];
const CS64_FACTOR = 0x82893933n;
const CS64_ADJ0 = 0xF2F90B1An;
const CS64_ADJ1 = 0x0B1A0000n;
const BM = 0xFFFFFFFFn;

const brol16 = (v) => (((v << 16n) | (v >> 16n)) & BM);
const bwords = (data) => {
  const bytes = Buffer.from(data);
  const padded = Buffer.concat([bytes, Buffer.alloc((4 - (bytes.length % 4)) % 4)]);
  const words = [];
  for (let i = 0; i < padded.length; i += 4) words.push(BigInt(padded.readUInt32LE(i)));
  if (words.length % 2) words.push(0n);
  return words;
};

export function cs64Digest(data, digest) {
  const keyA = BigInt(digest.readUInt32LE(0)) | 1n;
  const keyB = BigInt(digest.readUInt32LE(4)) | 1n;
  const factors = [(keyA * CS64_FACTOR) & BM, (keyB * CS64_FACTOR) & BM];
  const terms = CS64_COEFFICIENTS.map(([coef], i) => (BigInt(coef) * factors[i % 2]) & BM);
  const offsets = CS64_COEFFICIENTS.map(([, off]) => BigInt(off));
  bwords(Buffer.concat([Buffer.from([0]), Buffer.from(data)])).forEach((word, i) => {
    const even = i % 2 === 0;
    let term = (word * (even ? keyA : keyB)) & BM;
    let offset = brol16(word) * (even ? 0xEF0569FBn : 0xC31713DBn);
    if (i === 0) {
      term = (term + CS64_ADJ0 * factors[0]) & BM;
      offset = (offset + CS64_ADJ1) & BM;
    }
    terms.push(term & BM);
    offsets.push(offset & BM);
  });
  let swapAcc = 0n, swapLast = 0n, state = 0n, acc = 0n;
  for (let i = 0; i < terms.length; i += 2) {
    const x = terms[i], y = terms[i + 1];
    let t = brol16((offsets[i] + x) & BM);
    let q = (t * 0x76F50F34n) & BM;
    swapAcc = (swapAcc + ((brol16(q) * 0xC3EFEA97n + q) & BM)) & BM;
    t = brol16((offsets[i + 1] + y) & BM);
    q = (t * 0x1881CE3Cn) & BM;
    swapLast = (brol16(q) * 0x35BD1EC9n + q) & BM;
    swapAcc = (swapAcc + swapLast) & BM;

    state = (state * keyA + x) & BM;
    state = (brol16(state) * 0xCF98B111n) & BM;
    state = (brol16(state) * 0x87085B9Fn) & BM;
    state = (brol16(state) * 0x12CEB96Dn) & BM;
    state = (brol16(state) * 0x257E1D83n) & BM;
    acc = (acc + state) & BM;
    let t2 = (state * keyB + y) & BM;
    t2 = (brol16(t2) * 0xA27416F5n) & BM;
    t2 = (brol16(t2) * 0xD38396FFn) & BM;
    state = (brol16((brol16(t2) * 0x7C932B89n) & BM) * 0xBFA49F69n) & BM;
    acc = (acc + state) & BM;
  }
  // Python packs both words little-endian (`struct.pack("<II", ...)`).
  const hex = (big) => {
    const v = Number(big & BM);
    return [0, 8, 16, 24].map((s) => ((v >>> s) & 0xff).toString(16).toUpperCase().padStart(2, '0')).join('');
  };
  const lo = (v) => v;
  return hex(lo(swapLast ^ state)) + hex(lo(swapAcc ^ acc));
}

export function tokenSalt(unixTimestamp) {
  let ticks = unixTimestamp === undefined ? Date.now() / 1000 : unixTimestamp;
  ticks = ticks + WIN_EPOCH;
  ticks = ticks - (ticks % 300);
  ticks = ticks * 1e7;
  return Buffer.from(`${ticks.toFixed(0)}${TRUSTED}`, 'ascii');
}

export function generateSecMsGec(unixTimestamp) {
  const salt = tokenSalt(unixTimestamp);
  const digest = sha256Digest(salt);
  return `${cs64Digest(salt, digest)}-${digest.toString('hex').toUpperCase()}`;
}

// 这份算法是从 F:\dsharness\probe\edge_token.mjs 原样搬过来的（连注释），
// 因为它的正确性靠的是「控制流一模一样」，重写一遍就等于重新踩一遍坑。
// 8 个时间戳与 Python `edge_tts.drm.generate_sec_ms_gec_v2` 逐字节比对过；
// tests/edge-token.test.js 里钉住了其中三个，谁改坏了测试就红。

