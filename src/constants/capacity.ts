/**
 * @fileoverview Tablas de capacidad para códigos QR
 * @description Capacidad de caracteres por versión y nivel de corrección
 * para el modo Byte (8 bits por carácter).
 * @module constants/capacity
 * @see {@link https://www.thonky.com/qr-code-tutorial/character-capacities}
 */

import type { CapacityInfo } from "../types";

/**
 * Capacidad de caracteres en modo Byte para cada versión (1-40).
 * Indexado por versión - 1.
 *
 * @example
 * ```typescript
 * // Obtener capacidad para versión 1, corrección M
 * const capacity = BYTE_CAPACITY[0].M; // 14 caracteres
 * ```
 */
export const BYTE_CAPACITY: readonly CapacityInfo[] = [
	{ L: 17, M: 14, Q: 11, H: 7 },
	{ L: 32, M: 26, Q: 20, H: 14 },
	{ L: 53, M: 42, Q: 32, H: 24 },
	{ L: 78, M: 62, Q: 46, H: 34 },
	{ L: 106, M: 84, Q: 60, H: 44 },
	{ L: 134, M: 106, Q: 74, H: 58 },
	{ L: 154, M: 122, Q: 86, H: 64 },
	{ L: 192, M: 152, Q: 108, H: 84 },
	{ L: 230, M: 180, Q: 130, H: 98 },
	{ L: 271, M: 213, Q: 151, H: 119 },
	{ L: 321, M: 251, Q: 177, H: 137 },
	{ L: 367, M: 287, Q: 203, H: 155 },
	{ L: 425, M: 331, Q: 241, H: 177 },
	{ L: 458, M: 362, Q: 258, H: 194 },
	{ L: 520, M: 412, Q: 292, H: 220 },
	{ L: 586, M: 450, Q: 322, H: 250 },
	{ L: 644, M: 504, Q: 364, H: 280 },
	{ L: 718, M: 560, Q: 394, H: 310 },
	{ L: 792, M: 624, Q: 442, H: 338 },
	{ L: 858, M: 666, Q: 482, H: 382 },
	{ L: 929, M: 711, Q: 509, H: 403 },
	{ L: 1003, M: 779, Q: 565, H: 439 },
	{ L: 1091, M: 857, Q: 611, H: 461 },
	{ L: 1171, M: 911, Q: 661, H: 511 },
	{ L: 1273, M: 997, Q: 715, H: 535 },
	{ L: 1367, M: 1059, Q: 751, H: 593 },
	{ L: 1465, M: 1125, Q: 805, H: 625 },
	{ L: 1528, M: 1190, Q: 868, H: 658 },
	{ L: 1628, M: 1264, Q: 908, H: 698 },
	{ L: 1732, M: 1370, Q: 982, H: 742 },
	{ L: 1840, M: 1452, Q: 1030, H: 790 },
	{ L: 1952, M: 1538, Q: 1112, H: 842 },
	{ L: 2068, M: 1628, Q: 1168, H: 898 },
	{ L: 2188, M: 1722, Q: 1228, H: 958 },
	{ L: 2303, M: 1809, Q: 1283, H: 983 },
	{ L: 2431, M: 1911, Q: 1351, H: 1051 },
	{ L: 2563, M: 1989, Q: 1423, H: 1093 },
	{ L: 2699, M: 2099, Q: 1499, H: 1139 },
	{ L: 2809, M: 2213, Q: 1579, H: 1219 },
	{ L: 2953, M: 2331, Q: 1663, H: 1273 },
] as const;

/**
 * Total de codewords de datos por versión y nivel de corrección.
 * Estos son los bytes disponibles para datos después de reservar
 * espacio para corrección de errores.
 *
 * @example
 * ```typescript
 * // Obtener codewords de datos para versión 1, corrección L
 * const dataCodewords = TOTAL_DATA_CODEWORDS[0].L; // 19 codewords
 * ```
 */
export const TOTAL_DATA_CODEWORDS: readonly CapacityInfo[] = [
	{ L: 19, M: 16, Q: 13, H: 9 },
	{ L: 34, M: 28, Q: 22, H: 16 },
	{ L: 55, M: 44, Q: 34, H: 26 },
	{ L: 80, M: 64, Q: 48, H: 36 },
	{ L: 108, M: 86, Q: 62, H: 46 },
	{ L: 136, M: 108, Q: 76, H: 60 },
	{ L: 156, M: 124, Q: 88, H: 66 },
	{ L: 194, M: 154, Q: 110, H: 86 },
	{ L: 232, M: 182, Q: 132, H: 100 },
	{ L: 274, M: 216, Q: 154, H: 122 },
	{ L: 324, M: 254, Q: 180, H: 140 },
	{ L: 370, M: 290, Q: 206, H: 158 },
	{ L: 428, M: 334, Q: 244, H: 180 },
	{ L: 461, M: 365, Q: 261, H: 197 },
	{ L: 523, M: 415, Q: 295, H: 223 },
	{ L: 589, M: 453, Q: 325, H: 253 },
	{ L: 647, M: 507, Q: 367, H: 283 },
	{ L: 721, M: 563, Q: 397, H: 313 },
	{ L: 795, M: 627, Q: 445, H: 341 },
	{ L: 861, M: 669, Q: 485, H: 385 },
	{ L: 932, M: 714, Q: 512, H: 406 },
	{ L: 1006, M: 782, Q: 568, H: 442 },
	{ L: 1094, M: 860, Q: 614, H: 464 },
	{ L: 1174, M: 914, Q: 664, H: 514 },
	{ L: 1276, M: 1000, Q: 718, H: 538 },
	{ L: 1370, M: 1062, Q: 754, H: 596 },
	{ L: 1468, M: 1128, Q: 808, H: 628 },
	{ L: 1531, M: 1193, Q: 871, H: 661 },
	{ L: 1631, M: 1267, Q: 911, H: 701 },
	{ L: 1735, M: 1373, Q: 985, H: 745 },
	{ L: 1843, M: 1455, Q: 1033, H: 793 },
	{ L: 1955, M: 1541, Q: 1115, H: 845 },
	{ L: 2071, M: 1631, Q: 1171, H: 901 },
	{ L: 2191, M: 1725, Q: 1231, H: 961 },
	{ L: 2306, M: 1812, Q: 1286, H: 986 },
	{ L: 2434, M: 1914, Q: 1354, H: 1054 },
	{ L: 2566, M: 1992, Q: 1426, H: 1096 },
	{ L: 2702, M: 2102, Q: 1502, H: 1142 },
	{ L: 2812, M: 2216, Q: 1582, H: 1222 },
	{ L: 2956, M: 2334, Q: 1666, H: 1276 },
] as const;
