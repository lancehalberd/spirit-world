import { allTiles } from 'app/content/tiles';
import { paletteHash } from 'app/content/tiles/paletteHash';


export const sourcePalettes: {[key: string]: SourcePalette} = {};
paletteHash.everything = [[]];
let x = 0, y = 0;
for (let i = 0; i < allTiles.length; i++) {
    const image = allTiles[i]?.frame?.image;
    if (image instanceof HTMLImageElement) {
        const key = image.src.split('/gfx/')[1];
        sourcePalettes[key] = sourcePalettes[key] || {
            source: allTiles[i].frame,
            tiles: [],
            grid: [],
        };
        sourcePalettes[key].tiles.push(i);
    }
    if (!paletteHash.everything[y]) {
        paletteHash.everything[y] = [];
    }
    paletteHash.everything[y][x++] = i;
    if (x >= 16) {
        y++;
        x = 0;
    }
}

paletteHash.cave = [
    [750, 751, 752, 753, 754, 755, 756, 757, 758, 807, 808, 809, 806, 815, 816, 805],
    [759, 760, 761, 762, 763, 764, 765, 766, 758, 810, 0, 811, 817, 818, 819, 820],
    [793, 794, 795, 796, 797, 767, 768, 769, 770, 812, 813, 814, 821, 822, 823, 824],
    [798, 799, 800, 801, 802, 771, 772, 773, 774, , , , 804, 825, 826, 803],
    [1779, 833, 834, 1780, 847, 841, 842, 848, 732, 733, 734, 735, , , , 1],
    [827, 1, , 829, 835, , , 837, 736, 737, 738, 739, 882, 883, 884, 885],
    [828, 831, 832, 830, 836, 839, 840, 838, 740, 741, 742, 743, 746, 747, 748, 749],
    [1783, 843, 844, 1784, 853, 855, 856, 854, 744, 745, 867, 868, 869, 859, 860, 1],
    [, 849, 850, 845, 846, 861, 862, 857, 858, , 870, 871, 872, 865, 866, 1],
    [, , , 851, 852, , , 863, 864, , 873, 874, 875, 1781, 1782, 1],
    [, 790, 789, 792, 791, , 782, 781, 784, 783, 876, 877, 878, 1785, 1786, 1],
    [776, 786, 785, 788, 787, 775, 778, 777, 780, 779, 879, 880, 881, , , 57],
];

paletteHash.overworld = [
    [38,45,45,45,45,45,45,37,38,45,45,45,45,45,45,37],
    [46,219,220,211,212,221,222,47,46,227,228,203,204,229,230,47],
    [46,235,236,213,214,237,238,47,46,243,244,205,206,245,246,47],
    [46,215,216,44,43,207,208,47,46,207,208,57,57,215,216,47],
    [46,217,218,41,42,209,210,47,46,209,210,57,57,217,218,47],
    [46,225,226,203,204,223,224,47,46,231,232,211,212,233,234,47],
    [46,241,242,205,206,239,240,47,46,247,248,213,214,249,250,47],
    [39,48,48,48,48,48,48,40,39,48,48,48,48,48,48,40],
    [11,12,13,14,15,16,17,18,19,20,21,6,7,8,9,10],
    [36, 2,3,4,5,26,27,28,29,111,106,107,30,31,32,0],
    [49,50,51,52,53,54,55,56,1,1,1,33,34,35,0,0],
];

paletteHash.clouds = [
    [394, 395, 396, 406, 407, 0, 153, 154, 1],
    [398, 399, 400, 410, 411, 155, 156, 157, 158],
    [402, 403, 404, 408, 409, 159, 160, 161, 162],
    [397, 401, 405, 412, 413, 0, 163, 164, 1],
];

paletteHash.water = [
    [422, 423, 424, 429, 453, 454, 455, 425, 123, 124, 125, 132,289],
    [426, 427, 428, 456, 457, 458, 459, 460, 126, 127, 128, 132,290],
    [430, 431, 432, 0,   461, 462, 463, 0,   129, 130, 131, 1,  291],
    [433, 434, 435, 436, 464, 465, 466, 467, 133, 134, 135, 136,292],
    [437, 438, 439, 440, 468, 469, 470, 471, 137, 138, 139, 140,302],
    [0,   441, 442, 0,   0,   472, 473, 0,   0,   141, 142, 1,  303],
    [443, 444, 445, 446, 474, 475, 476, 477, 143, 144, 145, 146,304],
    [447, 448, 449, 450, 478, 479, 480, 481, 147, 148, 149, 150,0],
    [0,   451, 452, 0,   0,   482, 483, 0,   0,   151, 152, 1,  0],
];

paletteHash.trees = [
    [505, 506, 507, 508, 0, 517, 518, 519, 520, 1, 0, 517, 518, 519, 520, 1],
    [509, 510, 511, 512, 521, 522, 523, 524, 525, 526, 521, 522, 523, 524, 525, 526],
    [513, 514, 515, 516, 527, 528, 529, 530, 531, 532, 527, 528, 529, 530, 531, 532],
    [552, 553, 554, 555, 533, 534, 535, 536, 537, 538, 533, 534, 541, 542, 537, 538],
    [556, 557, 558, 559, 0, 0, 539, 540, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 517, 518, 519, 520, 517, 518, 519, 520, 1, 517, 518, 519, 520, 1, 1],
    [521, 522, 523, 524, 543, 544, 523, 524, 525, 549, 522, 523, 524, 525, 526, 1],
    [527, 528, 529, 530, 545, 546, 529, 530, 531, 550, 528, 529, 530, 531, 532, 0],
    [533, 534, 535, 536, 547, 548, 535, 536, 537, 551, 534, 535, 536, 537, 538, 0],
    [0, 0, 539, 540, 0, 0, 539, 540, 0, 0, 0, 539, 540, 0, 0, 0],
];

paletteHash.wooden = [
    [622, 623, 624, 625, 626, 627, 618, 619, 620, 621, 668, 669, 670, 57],
    [622, 623, 624, 625, 626, 627, 618, 619, 620, 621, 671, 672, 673, ],
    [571, 563, 570, 569, 1, 585, 586, 0, 636, 635, 674, 675, 676, ],
    [562, 574, 567, 560, 584, 581, 582, 583, 632, 631, 677, 678, 679, ],
    [566, 564, 565, 580, 579, 577, 576, 578, , , 680, 681, 682, ],
    [573, 561, 575, 572, , 587, 588, , , , , , , ],
    [628, 629, 630, 652, 653, 654, , 640, 641, , , 660, 661, ],
    [633, , 634, 655, , 656, 642, 643, 644, 645, 660, 662, 663, 661],
    [637, 638, 639, 657, 658, 659, 646, 647, 648, 649, 664, 665, 666, 667],
    [, , 593, 589, 590, 591, , 650, 651, , , 664, 667, ],
    [, 594, 600, 595, 596, 597, 592, , , 593, 589, 590, 591, ],
    [607, 599, 606, 595, 596, 603, 597, , 594, 731, 601, 602, 728, 592],
    [612, 605, 610, 601, 602, 608, 603, 607, 730, 615, , , 613, 729],
    [612, 611, 616, , , 613, 609, 617, 615, , , , , 614],
    [617, 615, , , , , 614, , , , , , , ],
];

paletteHash.crystalCave = [
    [979, 980, 981, 982, 983, 984, 985, 986, 987, 1029, 1030, 1031, 1028, 1037, 1038, 1027],
    [988, 989, 990, 991, 992, 993, 994, 995, 996, 1032, 0, 1033, 1039, 1040, 1041, 1042],
    [1004, 1005, 1006, 1008, 1023, 996, 997, 998, 999, 1034, 1035, 1036, 1043, 1044, 1045, 1046],
    [1018, 1019, 1020, 1021, 1022, 1000, 1001, 1002, 1003, , , , 1026, 1047, 1048, 1025],
    [1081, 1055, 1056, 1082, 1069, 1063, 1064, 1070, 961, 962, 963, 964, , , , ],
    [1049, 1, , 1051, 1057, , , 1059, 965, 966, 967, 968, 1104, 1105, 1106, 1107],
    [1050, 1053, 1054, 1052, 1058, 1061, 1062, 1060, 969, 970, 971, 972, 975, 976, 977, 978],
    [1087, 1065, 1066, 1088, 1075, 1077, 1078, 1076, 973, 974, 1089, 1090, 1091, , , ],
    [, 1071, 1072, 1067, 1068, 1083, 1084, 1079, 1080, , 1092, 1093, 1094, , , ],
    [, , , 1073, 1074, , , 1085, 1086, , 1095, 1096, 1097, , , ],
    [, 1015, 1014, 1017, 1016, , , , , , 1098, 1099, 1100, , , 57],
    [1007, 1011, 1010, 1013, 1012, , , , , , 1101, 1102, 1103, , , 1009],
];

paletteHash.stoneExterior = [
    [1327, 1328, 1329, 1330, 1364, 1365, 1366, 1367, 1368, 1351, 1352, 1353],
    [1336, 1343, 1326, 1336, 1369, 0, 0, 0, 1370, 1356, 1357, 1358],
    [1334, 1346, 1337, 1334, 1371, 0, 0, 0, 1372, 1348, 1349, 1350],
    [1345, 1328, 1329, 1347, 1373, 0, 0, 0, 1374, 1354, 0, 1355],
    [1338, 1339, 1340, 1341, 1375, 1376, 1377, 1378, 1379, 1359, 1360, 1361],
    [0, 0, 0, 0, 0, 1363, 0, 1324, 1332, 1333, 0, 0],
    [1310, 1311, 1312, 1313, 0, 1315, 0, 1320, 1314, 1362, 0, 0],
    [1316, 1317, 1318, 1319, 0, 1321, 0, 0, 0, 0, 0, 0],
    [1380, 1381, 1382, 1383, 0, 1325, 0, 0, 1322, 1323, 0, 0],
    [1217, 1218, 1216, 1215, 1214, 1388, 1401, 1402, 1445, 1407, 0, 0],
];

paletteHash.shadows = [
    [688, 689, 690, 691, 1, 684, 685, 686, 1],
    [704, 0, 0, 707, 692, 0, 0, 0, 695],
    [710, 0, 0, 713, 700, 0, 0, 0, 703],
    [719, 726, 727, 724, 708, 0, 0, 0, 709],
    [693, 694, 723, 720, 0, 715, 716, 717, ],
    [701, 702, 699, 696, 697, 698, 711, 712, ],
    [683, 687, 688, 691, 705, 706, 721, 722, ],
    [714, 718, 719, 724, , , , , ],
];
paletteHash.lava = [
    [886, 887, 888, 898, 899, 0, 898, 899, 1],
    [890, 891, 892, 902, 903, 898, 905, 904, 899],
    [894, 895, 896, 900, 901, 902, 901, 900, 903],
    [889, 893, 897, 904, 905, 0, 902, 903, 1],
    [1142, 1143, 1144, 1154, 1155, 0, 1154, 1155, 1],
    [1146, 1147, 1148, 1158, 1159, 1154, 1161, 1160, 1155],
    [1150, 1151, 1152, 1156, 1157, 1158, 1157, 1156, 1159],
    [1145, 1149, 1153, 1160, 1161, 0, 1158, 1159, 1],
];

// This overrides the generated palette in order to fine tune it.
// Remove this if you want to view the generated palette, for example if you want to see changes to it.
paletteHash.future = [
    [1568, 1569, 1570, 1577, 1569, 1578, 1581, null, 1582, null, 1611, 1612, null, 1602, 1603, 1604],
    [1571, 1572, 1573, 1571, 1572, 1573, null, null, null, 1613, 1614, 1615, 1616, 1605, 1606, 1607],
    [1574, 1575, 1576, 1579, 1575, 1580, 1583, null, 1584, 1617, 1618, 1619, 1620, 1608, 1609, 1610],
    [1585, 1586, 1587, 1594, 1586, 1595, 1598, 1627, 1599, 1621, 1622, 1623, 1624, 1630, 1631, 1632],
    [1588, 1589, 1590, 1588, 1589, 1590, null, 1628, null, null, 1625, 1626, null, 1633, 1634, 1635],
    [1591, 1592, 1593, 1596, 1592, 1597, 1600, 1629, 1601, null, null, null, null, 1636, 1637, 1638],
    [null, 1639, 1640, 1641, 1642, null, null, 1695, 1696, 1697, null, 1707, 1708],
    [1639, 1643, 1644, 1645, 1646, 1642, 1698, 1699, null, 1700, 1701, 1709, 1710],
    [1647, 1648, 1649, 1650, 1651, 1652, 1702, null, null, null, 1703, 1711, 1712],
    [1653, 1654, 1655, 1656, 1657, 1658, 1704, 1715, null, 1716, 1706, 1713, 1714],
    [1659, 1660, null, null, 1661, 1662, null, 1704, 1705, 1706],
    [1663, null, null, null, null, 1664],
    [null, null, 1665, 1675, 1680, 1685, null, null, null, null, 1735, 1736],
    [null, 1639, 1666, 1676, 1681, 1686, 1642, null, null, 1737, null, null, 1738],
    [1721, 1670, 1667, 1677, 1682, 1687, 1690, 1731, 1739, null, 1740, 1741, null, 1742],
    [1722, 1671, 1668, 1678, 1683, 1688, 1691, 1732, 1757, 1755, 1758,1762, 1761],
    [1702, 1672, 1669, 1679, 1684, 1689, 1692, 1703, 1751, null, 1750,1760, 1759],
    [1702, 1673, null, null, null, null, 1693, 1703, 1763, 1744, 1764],
    [1702, 1674, null, null, null, null, 1694, 1703, null, 1743, 1744, 1745, null],
    [1723, 1724, null, null, null, null, 1733, 1734, 1746, 1747, null, 1748, 1749],
    [null, 1719, null, null, null, null, 1720, null, 1750, null, null, null, 1751],
    [null, 1704, 1717, 1725, 1728, 1718, 1706, null, 1754, 1752, null, 1753, 1756],
    [null, null, 1726, 1727, 1729, 1730, null, null, null, 1754, 1755, 1756, null]
];

// Delete this fine tuned palette to see the generated pits palette.
paletteHash.pits = [
    [336, 337, 338, null,1 , 352, 353, 354, null,1],
    [339, 340, 341, 380, 381,355, 356, 357, 1765,1766],
    [342, 343, 344, 382, 383,358, 359, 360, 1767,1768],
    [345, 346, 347, 384, 385,361, 362, 363, 1769,1770],
    [348, 775, 349, 386, 387,364, 1007,365, 1771,1772],
    [350, 337, 351, 388, 389,366, 353, 367, 1773,1774],
    [null,4 ,  1,   390, 391,null,317, 1,   1775,1776],
    [null,null,null,392, 393,null,null,null,1777,1778],
    [1820, 1821, 1822, 1836, 1837],
    [1823, 1824, 1825, 1838, 1839],
    [1826, 1827, 1828, 1840, 1841],
    [1829, 1830, 1831, 1842, 1843],
    [1832, null, 1833, 1844, 1845],
    [1834, 1821, 1835, null, 1],
    [null, 1846, 1,    null, null],
];


// Use this to export the current brush as a palette grid.
/**
console.log(editingState.brush.none.tiles.map(t => "\t[" + t.join(", ") + "],").join("\n"));
 */
