import type { Era, HistoricalTeam, Player } from '../types';
import { computePlayerScore } from '../algorithms/powerRating';
import { applyNflAwardFloors } from './nfl-awards';
import { NFLVERSE_GENERATED_DEPTH_PLAYERS, NFLVERSE_GENERATED_UNITS } from './nflverse-generated-depth';

type SkillPosition = Extract<Player['position'], 'QB' | 'RB' | 'WR' | 'TE'>;

export type DepthPlayer = {
  name: string;
  position: SkillPosition;
  from: number;
  to: number;
  bestSeasonYear?: number;
  stats: Player['stats'];
  isLegend?: boolean;
  isAllStar?: boolean;
};

const qb = (name: string, from: number, to: number, passingYards: number, passingTDs: number, passerRating: number, interceptions: number, isLegend = false, isAllStar = false): DepthPlayer => ({
  name, position: 'QB', from, to, isLegend, isAllStar, stats: { passingYards, passingTDs, passerRating, interceptions },
});
const rb = (name: string, from: number, to: number, rushingYards: number, rushingTDs: number, receptions = 28, receivingYards = 220, isLegend = false, isAllStar = false): DepthPlayer => ({
  name, position: 'RB', from, to, isLegend, isAllStar, stats: { rushingYards, rushingTDs, receptions, receivingYards },
});
const wr = (name: string, from: number, to: number, receivingYards: number, receivingTDs: number, receptions = 70, isLegend = false, isAllStar = false): DepthPlayer => ({
  name, position: 'WR', from, to, isLegend, isAllStar, stats: { receivingYards, receivingTDs, receptions },
});
const te = (name: string, from: number, to: number, receivingYards: number, receivingTDs: number, receptions = 55, isLegend = false, isAllStar = false): DepthPlayer => ({
  name, position: 'TE', from, to, isLegend, isAllStar, stats: { receivingYards, receivingTDs, receptions },
});

export const NFL_FRANCHISE_DEPTH_PLAYERS: Record<string, DepthPlayer[]> = {
  '22': [
    qb('Jim Hart', 1966, 1983, 3121, 20, 82, 14, false, true), qb('Neil Lomax', 1981, 1988, 3387, 24, 92, 12, false, true), qb('Kurt Warner', 2005, 2009, 4583, 30, 96, 14, true), qb('Kyler Murray', 2019, 2024, 3971, 26, 101, 10, false, true),
    rb('Ottis Anderson', 1979, 1986, 1605, 8, 32, 300, true), rb('Stump Mitchell', 1981, 1989, 1006, 7, 44, 480, false, true), rb('David Johnson', 2015, 2019, 1239, 16, 80, 879, false, true),
    wr('Larry Fitzgerald', 2004, 2020, 1431, 12, 109, true), wr('Roy Green', 1979, 1990, 1555, 12, 78, false, true), wr('Anquan Boldin', 2003, 2009, 1377, 8, 101, false, true), wr('DeAndre Hopkins', 2020, 2022, 1407, 6, 115, false, true),
    te('Jackie Smith', 1963, 1977, 1205, 9, 56, true), te('Zach Ertz', 2021, 2023, 574, 3, 56, false, true),
  ],
  '1': [
    qb('Steve Bartkowski', 1975, 1985, 3544, 31, 97, 16, false, true), qb('Michael Vick', 2001, 2006, 2474, 20, 81, 13, false, true), qb('Matt Ryan', 2008, 2021, 4944, 38, 117, 7, false, true), qb('Chris Chandler', 1997, 2001, 3154, 25, 100, 12, false, true),
    rb('Jamal Anderson', 1994, 2001, 1846, 14, 27, 319, false, true), rb('Warrick Dunn', 2002, 2007, 1416, 3, 29, 220, false, true), rb('Michael Turner', 2008, 2012, 1699, 17, 6, 41, false, true),
    wr('Julio Jones', 2011, 2020, 1871, 8, 136, true), wr('Roddy White', 2005, 2015, 1389, 10, 115, false, true), wr('Andre Rison', 1990, 1994, 1208, 15, 93, false, true), wr('Drake London', 2022, 2024, 1000, 4, 75),
    te('Tony Gonzalez', 2009, 2013, 930, 8, 93, true), te('Alge Crumpler', 2001, 2007, 877, 5, 65, false, true),
  ],
  '33': [
    qb('Vinny Testaverde', 1996, 1997, 4177, 33, 88, 19, false, true), qb('Joe Flacco', 2008, 2018, 4317, 27, 91, 12, false, true), qb('Lamar Jackson', 2018, 2024, 3678, 36, 113, 6, true), qb('Steve McNair', 2006, 2007, 3050, 16, 82, 12, false, true),
    rb('Jamal Lewis', 2000, 2006, 2066, 14, 26, 205, false, true), rb('Ray Rice', 2008, 2013, 1364, 12, 76, 704, false, true), rb('Mark Ingram II', 2019, 2020, 1018, 10, 26, 247, false, true),
    wr('Derrick Mason', 2005, 2010, 1087, 7, 103, false, true), wr('Steve Smith Sr.', 2014, 2016, 1065, 6, 79, false, true), wr('Torrey Smith', 2011, 2014, 1128, 11, 65, false, true), wr('Anquan Boldin', 2010, 2012, 921, 7, 64, false, true),
    te('Todd Heap', 2001, 2010, 855, 7, 75, false, true), te('Mark Andrews', 2018, 2024, 1361, 9, 107, false, true),
  ],
  '2': [
    qb('Joe Ferguson', 1973, 1984, 2803, 18, 80, 15), qb('Jim Kelly', 1986, 1996, 3844, 33, 97, 17, true), qb('Drew Bledsoe', 2002, 2004, 4359, 24, 86, 15, false, true), qb('Josh Allen', 2018, 2024, 4544, 37, 107, 10, true),
    rb('O.J. Simpson', 1969, 1977, 2003, 12, 6, 70, true), rb('Thurman Thomas', 1988, 1999, 1487, 9, 62, 626, true), rb('LeSean McCoy', 2015, 2018, 1267, 13, 50, 356, false, true),
    wr('Andre Reed', 1985, 1999, 1312, 9, 90, true), wr('Eric Moulds', 1996, 2005, 1368, 9, 100, false, true), wr('Stefon Diggs', 2020, 2023, 1535, 8, 127, false, true), wr('Lee Evans', 2004, 2010, 1292, 8, 82, false, true),
    te('Pete Metzelaars', 1985, 1994, 609, 4, 68, false, true), te('Dawson Knox', 2019, 2024, 587, 9, 49),
  ],
  '29': [
    qb('Steve Beuerlein', 1995, 2000, 4436, 36, 94, 15, false, true), qb('Jake Delhomme', 2003, 2009, 3886, 29, 88, 15, false, true), qb('Cam Newton', 2011, 2019, 3837, 35, 99, 10, true), qb('Sam Darnold', 2021, 2022, 2527, 9, 82, 13),
    rb('Christian McCaffrey', 2017, 2022, 1387, 15, 116, 1005, true), rb('DeAngelo Williams', 2006, 2014, 1515, 18, 22, 121, false, true), rb('Jonathan Stewart', 2008, 2017, 1133, 10, 47, 413, false, true),
    wr('Steve Smith Sr.', 2001, 2013, 1563, 12, 103, true), wr('Muhsin Muhammad', 1996, 2004, 1405, 16, 93, false, true), wr('D.J. Moore', 2018, 2022, 1193, 4, 87, false, true), wr('Robby Anderson', 2020, 2021, 1096, 3, 95),
    te('Greg Olsen', 2011, 2019, 1104, 7, 84, false, true), te('Wesley Walls', 1996, 2002, 822, 12, 63, false, true),
  ],
  '3': [
    qb('Jim McMahon', 1982, 1988, 2392, 15, 82, 11, false, true), qb('Jay Cutler', 2009, 2016, 3812, 28, 89, 18, false, true), qb('Justin Fields', 2021, 2023, 2562, 17, 86, 9), qb('Mitch Trubisky', 2017, 2020, 3223, 24, 95, 12),
    rb('Walter Payton', 1975, 1987, 1852, 14, 49, 607, true), rb('Gale Sayers', 1965, 1971, 1231, 8, 34, 447, true), rb('Matt Forte', 2008, 2015, 1339, 9, 102, 808, false, true),
    wr('Brandon Marshall', 2012, 2014, 1508, 11, 118, false, true), wr('Alshon Jeffery', 2012, 2016, 1421, 7, 89, false, true), wr('Willie Gault', 1983, 1987, 704, 8, 33, false, true), wr('Allen Robinson', 2018, 2021, 1250, 6, 102, false, true),
    te('Mike Ditka', 1961, 1966, 1076, 12, 56, true), te('Greg Olsen', 2007, 2010, 612, 8, 60, false, true),
  ],
  '4': [
    qb('Ken Anderson', 1971, 1986, 4169, 27, 98, 10, true), qb('Boomer Esiason', 1984, 1992, 3572, 28, 97, 14, false, true), qb('Carson Palmer', 2003, 2010, 4131, 32, 101, 13, false, true), qb('Joe Burrow', 2020, 2024, 4611, 34, 109, 12, true),
    rb('Corey Dillon', 1997, 2003, 1435, 7, 39, 302, false, true), rb('Joe Mixon', 2017, 2023, 1205, 13, 43, 314, false, true), rb('Rudi Johnson', 2001, 2007, 1458, 12, 23, 90, false, true),
    wr('Chad Johnson', 2001, 2010, 1432, 9, 97, false, true), wr('A.J. Green', 2011, 2020, 1426, 11, 98, false, true), wr('JaMarr Chase', 2021, 2024, 1455, 13, 100, false, true), wr('Cris Collinsworth', 1981, 1988, 1009, 8, 67, false, true),
    te('Tyler Eifert', 2013, 2019, 615, 13, 52, false, true), te('Bob Trumpy', 1968, 1977, 835, 9, 37, false, true),
  ],
  '5': [
    qb('Brian Sipe', 1974, 1983, 4132, 30, 91, 14, false, true), qb('Bernie Kosar', 1985, 1993, 3854, 22, 96, 9, false, true), qb('Baker Mayfield', 2018, 2021, 3827, 27, 96, 14, false, true), qb('Deshaun Watson', 2022, 2024, 3119, 26, 103, 8, false, true),
    rb('Jim Brown', 1957, 1965, 1863, 12, 24, 268, true), rb('Leroy Kelly', 1964, 1973, 1239, 16, 34, 297, true), rb('Nick Chubb', 2018, 2024, 1525, 12, 36, 278, false, true),
    wr('Paul Warfield', 1964, 1969, 1067, 12, 52, true), wr('Josh Gordon', 2012, 2018, 1646, 9, 87, false, true), wr('Jarvis Landry', 2018, 2021, 1174, 6, 112, false, true), wr('Amari Cooper', 2022, 2024, 1250, 5, 78, false, true),
    te('Ozzie Newsome', 1978, 1990, 1002, 9, 89, true), te('Kellen Winslow Jr.', 2004, 2008, 1106, 5, 89, false, true),
  ],
  '6': [
    qb('Roger Staubach', 1969, 1979, 3190, 25, 104, 16, true), qb('Troy Aikman', 1989, 2000, 3445, 23, 100, 10, true), qb('Tony Romo', 2004, 2016, 4903, 36, 113, 9, false, true), qb('Dak Prescott', 2016, 2024, 4516, 36, 105, 9, false, true),
    rb('Tony Dorsett', 1977, 1987, 1646, 13, 32, 263, true), rb('Emmitt Smith', 1990, 2002, 1773, 25, 62, 375, true), rb('Ezekiel Elliott', 2016, 2022, 1631, 15, 77, 567, false, true),
    wr('Michael Irvin', 1988, 1999, 1603, 10, 111, true), wr('Dez Bryant', 2010, 2017, 1382, 16, 93, false, true), wr('CeeDee Lamb', 2020, 2024, 1749, 12, 135, false, true), wr('Drew Pearson', 1973, 1983, 1087, 8, 58, true),
    te('Jason Witten', 2003, 2019, 1145, 7, 110, true), te('Jay Novacek', 1990, 1995, 705, 5, 68, false, true),
  ],
  '7': [
    qb('Craig Morton', 1977, 1982, 2929, 21, 82, 14, false, true), qb('John Elway', 1983, 1998, 4030, 27, 93, 11, true), qb('Peyton Manning', 2012, 2015, 5477, 55, 116, 10, true), qb('Russell Wilson', 2022, 2023, 4070, 26, 98, 8, false, true),
    rb('Terrell Davis', 1995, 2001, 2008, 21, 25, 217, true), rb('Clinton Portis', 2002, 2003, 1591, 14, 38, 314, false, true), rb('C.J. Anderson', 2013, 2017, 1007, 3, 34, 324),
    wr('Rod Smith', 1995, 2006, 1602, 8, 113, false, true), wr('Demaryius Thomas', 2010, 2018, 1619, 11, 111, false, true), wr('Ed McCaffrey', 1995, 2003, 1317, 9, 101, false, true), wr('Courtland Sutton', 2018, 2024, 1112, 6, 72),
    te('Shannon Sharpe', 1990, 1999, 1107, 10, 87, true), te('Julius Thomas', 2011, 2014, 788, 12, 65, false, true),
  ],
  '8': [
    qb('Greg Landry', 1968, 1978, 2237, 18, 89, 10, false, true), qb('Matthew Stafford', 2009, 2020, 5038, 41, 97, 16, false, true), qb('Jared Goff', 2021, 2024, 4575, 30, 99, 12, false, true), qb('Scott Mitchell', 1994, 1998, 4338, 32, 92, 12, false, true),
    rb('Barry Sanders', 1989, 1998, 2053, 11, 48, 305, true), rb('Billy Sims', 1980, 1984, 1303, 13, 51, 621, false, true), rb('Jahvid Best', 2010, 2011, 555, 4, 58, 487),
    wr('Calvin Johnson', 2007, 2015, 1964, 16, 122, true), wr('Herman Moore', 1991, 2001, 1686, 14, 123, false, true), wr('Amon-Ra St. Brown', 2021, 2024, 1515, 10, 119, false, true), wr('Golden Tate', 2014, 2018, 1331, 4, 99),
    te('Charlie Sanders', 1968, 1977, 656, 4, 42, true), te('T.J. Hockenson', 2019, 2022, 723, 6, 67, false, true),
  ],
  '9': [
    qb('Bart Starr', 1956, 1971, 2257, 16, 105, 9, true), qb('Brett Favre', 1992, 2007, 4413, 39, 99, 13, true), qb('Aaron Rodgers', 2005, 2022, 4643, 48, 122, 5, true), qb('Jordan Love', 2020, 2024, 4159, 32, 96, 11, false, true),
    rb('Ahman Green', 2000, 2006, 1883, 15, 50, 367, false, true), rb('Eddie Lacy', 2013, 2016, 1178, 11, 35, 257, false, true), rb('Aaron Jones', 2017, 2023, 1121, 16, 49, 474, false, true),
    wr('Sterling Sharpe', 1988, 1994, 1461, 18, 112, false, true), wr('Donald Driver', 1999, 2012, 1295, 8, 92, false, true), wr('Davante Adams', 2014, 2021, 1553, 18, 123, false, true), wr('Jordy Nelson', 2008, 2017, 1519, 13, 98, false, true),
    te('Paul Coffman', 1978, 1985, 814, 11, 56, false, true), te('Jermichael Finley', 2008, 2013, 767, 8, 61, false, true),
  ],
  '34': [
    qb('David Carr', 2002, 2006, 3531, 16, 83, 14), qb('Matt Schaub', 2007, 2013, 4770, 29, 98, 15, false, true), qb('Deshaun Watson', 2017, 2020, 4823, 33, 112, 7, false, true), qb('C.J. Stroud', 2023, 2024, 4108, 23, 100, 5, false, true),
    rb('Arian Foster', 2009, 2015, 1616, 16, 66, 604, false, true), rb('Lamar Miller', 2016, 2018, 1073, 5, 31, 188), rb('Domanick Williams', 2003, 2005, 1188, 13, 68, 588, false, true),
    wr('Andre Johnson', 2003, 2014, 1598, 8, 115, true), wr('DeAndre Hopkins', 2013, 2019, 1572, 11, 111, false, true), wr('Nico Collins', 2021, 2024, 1297, 8, 80, false, true), wr('Will Fuller V', 2016, 2020, 879, 8, 53),
    te('Owen Daniels', 2006, 2013, 862, 5, 70, false, true), te('Dalton Schultz', 2023, 2024, 635, 5, 59),
  ],
  '11': [
    qb('Bert Jones', 1973, 1981, 3104, 24, 102, 9, false, true), qb('Peyton Manning', 1998, 2010, 5572, 49, 121, 10, true), qb('Andrew Luck', 2012, 2018, 4761, 40, 96, 16, false, true), qb('Philip Rivers', 2020, 2020, 4169, 24, 98, 11, false, true),
    rb('Marshall Faulk', 1994, 1998, 1319, 11, 86, 908, true), rb('Edgerrin James', 1999, 2005, 1709, 18, 63, 594, true), rb('Jonathan Taylor', 2020, 2024, 1811, 18, 40, 360, false, true),
    wr('Marvin Harrison', 1996, 2008, 1722, 15, 143, true), wr('Reggie Wayne', 2001, 2014, 1510, 10, 104, true), wr('T.Y. Hilton', 2012, 2021, 1448, 6, 91, false, true), wr('Michael Pittman Jr.', 2020, 2024, 1152, 4, 109),
    te('Dallas Clark', 2003, 2011, 1106, 10, 100, false, true), te('Jack Doyle', 2013, 2021, 690, 5, 80),
  ],
  '30': [
    qb('Mark Brunell', 1995, 2003, 4367, 20, 92, 14, false, true), qb('David Garrard', 2002, 2010, 3620, 23, 102, 3, false, true), qb('Blake Bortles', 2014, 2018, 4428, 35, 88, 18), qb('Trevor Lawrence', 2021, 2024, 4113, 25, 95, 8, false, true),
    rb('Fred Taylor', 1998, 2008, 1572, 14, 36, 370, false, true), rb('Maurice Jones-Drew', 2006, 2013, 1606, 15, 43, 374, false, true), rb('Leonard Fournette', 2017, 2019, 1040, 9, 36, 302, false, true),
    wr('Jimmy Smith', 1995, 2005, 1636, 8, 116, false, true), wr('Keenan McCardell', 1996, 2001, 1207, 5, 94, false, true), wr('Allen Robinson', 2014, 2017, 1400, 14, 80, false, true), wr('Christian Kirk', 2022, 2024, 1108, 8, 84),
    te('Marcedes Lewis', 2006, 2017, 700, 10, 58, false, true), te('Evan Engram', 2022, 2024, 963, 4, 114, false, true),
  ],
  '12': [
    qb('Len Dawson', 1962, 1975, 2879, 30, 101, 17, true), qb('Joe Montana', 1993, 1994, 3283, 16, 88, 9, true), qb('Trent Green', 2001, 2006, 4591, 27, 96, 17, false, true), qb('Patrick Mahomes', 2017, 2024, 5250, 50, 113, 12, true),
    rb('Priest Holmes', 2001, 2007, 1615, 27, 74, 672, false, true), rb('Jamaal Charles', 2008, 2016, 1509, 12, 70, 693, false, true), rb('Kareem Hunt', 2017, 2018, 1327, 8, 53, 455, false, true),
    wr('Otis Taylor', 1965, 1975, 1110, 7, 57, true), wr('Tyreek Hill', 2016, 2021, 1479, 12, 111, false, true), wr('Dwayne Bowe', 2007, 2014, 1162, 15, 72, false, true), wr('Rashee Rice', 2023, 2024, 938, 7, 79),
    te('Tony Gonzalez', 1997, 2008, 1258, 7, 102, true), te('Travis Kelce', 2013, 2024, 1416, 11, 110, true),
  ],
  '13': [
    qb('Ken Stabler', 1970, 1979, 3615, 27, 103, 17, true), qb('Jim Plunkett', 1978, 1986, 2935, 20, 84, 16, false, true), qb('Rich Gannon', 1999, 2004, 4689, 26, 97, 10, false, true), qb('Derek Carr', 2014, 2022, 4804, 34, 101, 14, false, true),
    rb('Marcus Allen', 1982, 1992, 1759, 11, 67, 555, true), rb('Bo Jackson', 1987, 1990, 950, 4, 9, 68, true), rb('Josh Jacobs', 2019, 2023, 1653, 12, 53, 400, false, true),
    wr('Cliff Branch', 1972, 1985, 1092, 13, 60, true), wr('Tim Brown', 1988, 2003, 1408, 9, 104, true), wr('Davante Adams', 2022, 2024, 1516, 14, 100, false, true), wr('Fred Biletnikoff', 1965, 1978, 1037, 12, 61, true),
    te('Dave Casper', 1974, 1980, 852, 9, 57, true), te('Todd Christensen', 1979, 1988, 1247, 12, 95, false, true),
  ],
  '24': [
    qb('Dan Fouts', 1973, 1987, 4802, 33, 93, 17, true), qb('Philip Rivers', 2004, 2019, 4710, 34, 105, 11, false, true), qb('Justin Herbert', 2020, 2024, 5014, 38, 98, 15, false, true), qb('Drew Brees', 2001, 2005, 3576, 27, 104, 7, false, true),
    rb('LaDainian Tomlinson', 2001, 2009, 1815, 28, 100, 508, true), rb('Austin Ekeler', 2017, 2023, 915, 13, 107, 722, false, true), rb('Chuck Muncie', 1980, 1984, 1144, 19, 43, 359, false, true),
    wr('Lance Alworth', 1962, 1970, 1602, 14, 73, true), wr('Charlie Joiner', 1976, 1986, 1188, 7, 72, true), wr('Keenan Allen', 2013, 2023, 1393, 6, 106, false, true), wr('Wes Chandler', 1981, 1987, 1032, 9, 49, false, true),
    te('Kellen Winslow', 1979, 1987, 1290, 9, 89, true), te('Antonio Gates', 2003, 2018, 1157, 13, 89, true),
  ],
  '14': [
    qb('Roman Gabriel', 1962, 1972, 3219, 24, 86, 12, false, true), qb('Kurt Warner', 1998, 2003, 4830, 36, 109, 13, true), qb('Marc Bulger', 2002, 2009, 4301, 24, 93, 14, false, true), qb('Matthew Stafford', 2021, 2024, 4886, 41, 103, 17, false, true),
    rb('Eric Dickerson', 1983, 1987, 2105, 14, 21, 139, true), rb('Marshall Faulk', 1999, 2005, 1382, 18, 87, 1048, true), rb('Todd Gurley', 2015, 2019, 1305, 17, 64, 788, false, true), rb('Steven Jackson', 2004, 2012, 1528, 13, 90, 806, false, true),
    wr('Isaac Bruce', 1994, 2007, 1781, 13, 119, true), wr('Torry Holt', 1999, 2008, 1696, 12, 117, true), wr('Cooper Kupp', 2017, 2024, 1947, 16, 145, false, true), wr('Henry Ellard', 1983, 1993, 1414, 10, 86, false, true),
    te('Ernie Conwell', 1996, 2002, 431, 4, 38), te('Tyler Higbee', 2016, 2024, 734, 3, 72),
  ],
  '15': [
    qb('Bob Griese', 1967, 1980, 2473, 22, 87, 11, true), qb('Dan Marino', 1983, 1999, 5084, 48, 109, 17, true), qb('Tua Tagovailoa', 2020, 2024, 4624, 29, 105, 14, false, true), qb('Ryan Tannehill', 2012, 2018, 4208, 27, 93, 12),
    rb('Larry Csonka', 1968, 1974, 1117, 7, 21, 183, true), rb('Ricky Williams', 2002, 2010, 1853, 16, 47, 363, false, true), rb('Ronnie Brown', 2005, 2010, 1008, 5, 39, 389, false, true),
    wr('Mark Clayton', 1983, 1992, 1389, 18, 73, false, true), wr('Mark Duper', 1982, 1992, 1306, 8, 71, false, true), wr('Tyreek Hill', 2022, 2024, 1799, 13, 119, false, true), wr('Jaylen Waddle', 2021, 2024, 1356, 8, 104, false, true),
    te('Keith Jackson', 1992, 1994, 680, 6, 60, false, true), te('Mike Gesicki', 2018, 2022, 780, 6, 73),
  ],
  '16': [
    qb('Fran Tarkenton', 1961, 1978, 3468, 25, 92, 13, true), qb('Daunte Culpepper', 1999, 2005, 4717, 39, 110, 11, false, true), qb('Kirk Cousins', 2018, 2023, 4547, 35, 107, 13, false, true), qb('Tommy Kramer', 1977, 1989, 3912, 26, 92, 24, false, true),
    rb('Chuck Foreman', 1973, 1979, 1070, 13, 73, 691, false, true), rb('Adrian Peterson', 2007, 2016, 2097, 18, 40, 217, true), rb('Dalvin Cook', 2017, 2022, 1557, 16, 44, 361, false, true),
    wr('Cris Carter', 1990, 2001, 1371, 17, 122, true), wr('Randy Moss', 1998, 2004, 1632, 17, 111, true), wr('Justin Jefferson', 2020, 2024, 1809, 8, 128, false, true), wr('Adam Thielen', 2013, 2022, 1373, 9, 113, false, true),
    te('Steve Jordan', 1982, 1994, 859, 6, 68, false, true), te('Kyle Rudolph', 2011, 2020, 840, 7, 83),
  ],
  '17': [
    qb('Steve Grogan', 1975, 1990, 3286, 28, 84, 20, false, true), qb('Drew Bledsoe', 1993, 2001, 4555, 27, 84, 15, false, true), qb('Tom Brady', 2000, 2019, 5235, 50, 117, 8, true), qb('Mac Jones', 2021, 2023, 3801, 22, 92, 13),
    rb('Curtis Martin', 1995, 1997, 1487, 14, 46, 454, true), rb('Corey Dillon', 2004, 2006, 1635, 12, 15, 103, false, true), rb('James White', 2014, 2021, 425, 5, 87, 751, false, true),
    wr('Stanley Morgan', 1977, 1989, 1491, 10, 44, true), wr('Randy Moss', 2007, 2010, 1493, 23, 98, true), wr('Wes Welker', 2007, 2012, 1569, 9, 123, false, true), wr('Julian Edelman', 2009, 2020, 1117, 6, 105, false, true),
    te('Ben Coates', 1991, 1999, 1174, 7, 96, false, true), te('Rob Gronkowski', 2010, 2018, 1327, 17, 90, true),
  ],
  '18': [
    qb('Archie Manning', 1971, 1982, 3716, 23, 87, 14, false, true), qb('Drew Brees', 2006, 2020, 5476, 46, 116, 14, true), qb('Aaron Brooks', 2000, 2005, 3832, 27, 88, 15), qb('Derek Carr', 2023, 2024, 3878, 25, 97, 8, false, true),
    rb('Deuce McAllister', 2001, 2008, 1641, 8, 69, 516, false, true), rb('Alvin Kamara', 2017, 2024, 932, 14, 83, 756, false, true), rb('Mark Ingram II', 2011, 2021, 1124, 12, 58, 416, false, true),
    wr('Marques Colston', 2006, 2015, 1202, 11, 98, false, true), wr('Michael Thomas', 2016, 2022, 1725, 9, 149, false, true), wr('Joe Horn', 2000, 2006, 1399, 11, 94, false, true), wr('Eric Martin', 1985, 1993, 1090, 7, 85, false, true),
    te('Jimmy Graham', 2010, 2014, 1310, 16, 99, false, true), te('Ben Watson', 2013, 2018, 825, 6, 74),
  ],
  '19': [
    qb('Phil Simms', 1979, 1993, 3487, 22, 92, 14, false, true), qb('Eli Manning', 2004, 2019, 4933, 35, 93, 14, false, true), qb('Daniel Jones', 2019, 2024, 3205, 24, 92, 12), qb('Kerry Collins', 1999, 2003, 4073, 22, 86, 13),
    rb('Tiki Barber', 1997, 2006, 1860, 9, 54, 530, false, true), rb('Saquon Barkley', 2018, 2024, 1312, 10, 91, 721, false, true), rb('Rodney Hampton', 1990, 1997, 1182, 14, 32, 254, false, true),
    wr('Odell Beckham Jr.', 2014, 2018, 1450, 13, 101, false, true), wr('Amani Toomer', 1996, 2008, 1343, 8, 82, false, true), wr('Victor Cruz', 2010, 2016, 1536, 9, 82, false, true), wr('Plaxico Burress', 2005, 2008, 1025, 12, 70, false, true),
    te('Mark Bavaro', 1985, 1990, 1001, 4, 66, false, true), te('Jeremy Shockey', 2002, 2007, 894, 2, 74, false, true),
  ],
  '20': [
    qb('Joe Namath', 1965, 1976, 4007, 26, 72, 28, true), qb('Ken OBrien', 1984, 1992, 3888, 25, 96, 8, false, true), qb('Chad Pennington', 2000, 2007, 3120, 22, 104, 6, false, true), qb('Mark Sanchez', 2009, 2012, 3291, 26, 78, 18),
    rb('Curtis Martin', 1998, 2005, 1697, 12, 43, 454, true), rb('Freeman McNeil', 1981, 1992, 1331, 7, 44, 275, false, true), rb('Breece Hall', 2022, 2024, 994, 5, 76, 591, false, true),
    wr('Don Maynard', 1960, 1972, 1297, 14, 57, true), wr('Wesley Walker', 1977, 1989, 1169, 12, 65, false, true), wr('Al Toon', 1985, 1992, 1176, 8, 93, false, true), wr('Garrett Wilson', 2022, 2024, 1103, 4, 95, false, true),
    te('Mickey Shuler', 1978, 1989, 879, 7, 76, false, true), te('Dustin Keller', 2008, 2012, 815, 5, 65),
  ],
  '21': [
    qb('Ron Jaworski', 1977, 1986, 3529, 27, 91, 12, false, true), qb('Randall Cunningham', 1985, 1995, 3466, 30, 106, 13, false, true), qb('Donovan McNabb', 1999, 2009, 3916, 31, 96, 8, false, true), qb('Jalen Hurts', 2020, 2024, 3858, 23, 101, 6, false, true),
    rb('Wilbert Montgomery', 1977, 1984, 1512, 9, 41, 407, false, true), rb('Brian Westbrook', 2002, 2009, 1333, 7, 90, 771, false, true), rb('LeSean McCoy', 2009, 2014, 1607, 9, 78, 539, false, true),
    wr('Harold Carmichael', 1971, 1983, 1116, 9, 67, true), wr('Mike Quick', 1982, 1990, 1409, 13, 69, false, true), wr('DeSean Jackson', 2008, 2019, 1332, 9, 62, false, true), wr('A.J. Brown', 2022, 2024, 1496, 11, 106, false, true),
    te('Zach Ertz', 2013, 2021, 1163, 8, 116, false, true), te('Dallas Goedert', 2018, 2024, 830, 4, 59, false, true),
  ],
  '23': [
    qb('Terry Bradshaw', 1970, 1983, 3724, 28, 84, 20, true), qb('Ben Roethlisberger', 2004, 2021, 5129, 34, 103, 11, true), qb('Kenny Pickett', 2022, 2023, 2404, 7, 81, 9), qb('Neil ODonnell', 1991, 1995, 3208, 17, 90, 7, false, true),
    rb('Franco Harris', 1972, 1983, 1246, 14, 33, 291, true), rb('Jerome Bettis', 1996, 2005, 1431, 13, 18, 165, true), rb('LeVeon Bell', 2013, 2017, 1361, 8, 85, 854, false, true),
    wr('Lynn Swann', 1974, 1982, 880, 11, 61, true), wr('John Stallworth', 1974, 1987, 1395, 12, 80, true), wr('Antonio Brown', 2010, 2018, 1834, 10, 136, false, true), wr('Hines Ward', 1998, 2011, 1329, 12, 112, false, true),
    te('Heath Miller', 2005, 2015, 816, 8, 76, false, true), te('Pat Freiermuth', 2021, 2024, 732, 2, 63),
  ],
  '25': [
    qb('Joe Montana', 1979, 1992, 3944, 31, 113, 8, true), qb('Steve Young', 1987, 1999, 4170, 36, 112, 10, true), qb('Jeff Garcia', 1999, 2003, 4278, 32, 94, 12, false, true), qb('Brock Purdy', 2022, 2024, 4280, 31, 113, 11, false, true),
    rb('Roger Craig', 1983, 1990, 1050, 9, 92, 1016, false, true), rb('Frank Gore', 2005, 2014, 1695, 8, 61, 485, true), rb('Christian McCaffrey', 2022, 2024, 1459, 14, 67, 564, true),
    wr('Jerry Rice', 1985, 2000, 1848, 22, 122, true), wr('Terrell Owens', 1996, 2003, 1451, 13, 100, true), wr('Deebo Samuel', 2019, 2024, 1405, 6, 77, false, true), wr('Brandon Aiyuk', 2020, 2024, 1342, 7, 75, false, true),
    te('Brent Jones', 1987, 1997, 747, 5, 68, false, true), te('George Kittle', 2017, 2024, 1377, 5, 88, false, true),
  ],
  '26': [
    qb('Jim Zorn', 1976, 1984, 3661, 20, 82, 20, false, true), qb('Dave Krieg', 1980, 1991, 3602, 32, 92, 18, false, true), qb('Matt Hasselbeck', 2001, 2010, 3966, 28, 98, 15, false, true), qb('Russell Wilson', 2012, 2021, 4219, 40, 111, 13, false, true),
    rb('Curt Warner', 1983, 1989, 1449, 13, 42, 325, false, true), rb('Shaun Alexander', 2000, 2007, 1880, 27, 15, 78, false, true), rb('Marshawn Lynch', 2010, 2015, 1590, 12, 37, 367, false, true),
    wr('Steve Largent', 1976, 1989, 1287, 12, 79, true), wr('Doug Baldwin', 2011, 2018, 1128, 14, 78, false, true), wr('Tyler Lockett', 2015, 2024, 1175, 10, 100, false, true), wr('DK Metcalf', 2019, 2024, 1303, 10, 83, false, true),
    te('Jimmy Graham', 2015, 2017, 923, 6, 65, false, true), te('Zach Miller', 2011, 2014, 396, 3, 38),
  ],
  '27': [
    qb('Doug Williams', 1978, 1982, 3563, 19, 79, 24, false, true), qb('Brad Johnson', 2001, 2004, 3811, 22, 92, 6, false, true), qb('Jameis Winston', 2015, 2019, 5109, 33, 84, 30), qb('Tom Brady', 2020, 2022, 5316, 43, 103, 12, true), qb('Baker Mayfield', 2023, 2024, 4044, 28, 94, 10, false, true),
    rb('James Wilder', 1981, 1989, 1544, 13, 85, 685, false, true), rb('Warrick Dunn', 1997, 2001, 1133, 8, 68, 557, false, true), rb('Mike Alstott', 1996, 2006, 949, 10, 65, 557, false, true),
    wr('Mike Evans', 2014, 2024, 1524, 13, 96, false, true), wr('Chris Godwin', 2017, 2024, 1333, 9, 86, false, true), wr('Keyshawn Johnson', 2000, 2003, 1106, 8, 106, false, true), wr('Mark Carrier', 1987, 1992, 1422, 9, 86, false, true),
    te('Rob Gronkowski', 2020, 2021, 802, 6, 55, true), te('Cameron Brate', 2014, 2022, 660, 8, 57),
  ],
  '10': [
    qb('Warren Moon', 1984, 1993, 4690, 33, 96, 14, true), qb('Steve McNair', 1995, 2005, 3387, 24, 100, 7, false, true), qb('Ryan Tannehill', 2019, 2023, 3819, 33, 117, 7, false, true), qb('Vince Young', 2006, 2010, 2546, 12, 82, 13),
    rb('Earl Campbell', 1978, 1984, 1934, 13, 12, 47, true), rb('Eddie George', 1996, 2003, 1509, 14, 50, 453, false, true), rb('Chris Johnson', 2008, 2013, 2006, 14, 50, 503, false, true), rb('Derrick Henry', 2016, 2023, 2027, 17, 18, 206, true),
    wr('Ernest Givins', 1986, 1994, 1062, 9, 72, false, true), wr('Derrick Mason', 1997, 2004, 1303, 9, 96, false, true), wr('A.J. Brown', 2019, 2021, 1075, 11, 70, false, true), wr('DeAndre Hopkins', 2023, 2024, 1057, 7, 75, false, true),
    te('Frank Wycheck', 1995, 2003, 768, 4, 70, false, true), te('Delanie Walker', 2013, 2019, 1088, 6, 94, false, true),
  ],
  '28': [
    qb('Sonny Jurgensen', 1964, 1974, 3747, 31, 87, 16, true), qb('Joe Theismann', 1974, 1985, 3714, 29, 97, 11, false, true), qb('Mark Rypien', 1988, 1993, 3564, 28, 97, 11, false, true), qb('Kirk Cousins', 2012, 2017, 4917, 25, 101, 12, false, true),
    rb('John Riggins', 1976, 1985, 1347, 24, 12, 89, true), rb('Clinton Portis', 2004, 2010, 1516, 11, 47, 389, false, true), rb('Alfred Morris', 2012, 2015, 1613, 13, 11, 77, false, true),
    wr('Art Monk', 1980, 1993, 1372, 7, 106, true), wr('Gary Clark', 1985, 1992, 1340, 10, 79, false, true), wr('Santana Moss', 2005, 2014, 1483, 9, 84, false, true), wr('Terry McLaurin', 2019, 2024, 1191, 7, 87, false, true),
    te('Jerry Smith', 1965, 1977, 849, 9, 54, false, true), te('Chris Cooley', 2004, 2012, 849, 8, 83, false, true), te('Jordan Reed', 2013, 2018, 952, 11, 87, false, true),
  ],
};

const UNIT_OVERRIDES: Record<string, {
  ol?: string;
  defense?: string;
  defensiveStarCount?: number;
  defensiveHofCount?: number;
}> = {
  '3-1985': { defense: '1985 Bears Defense', defensiveStarCount: 5, defensiveHofCount: 3 },
  '6-1990': { ol: 'Great Wall of Dallas', defense: '1992 Cowboys Defense', defensiveStarCount: 3, defensiveHofCount: 1 },
  '9-1995': { ol: 'Favre Era Packers O-Line' },
  '12-2020': { ol: 'Creed and Thuney O-Line', defense: '2023 Chiefs Defense', defensiveStarCount: 3 },
  '17-2000': { defense: '2003 Patriots Defense', defensiveStarCount: 4, defensiveHofCount: 1 },
  '23-1975': { defense: 'Steel Curtain Defense', defensiveStarCount: 6, defensiveHofCount: 4 },
  '25-1985': { defense: '1989 49ers Defense', defensiveStarCount: 4, defensiveHofCount: 2 },
  '26-2010': { defense: 'Legion of Boom Defense', defensiveStarCount: 5, defensiveHofCount: 1 },
};

type OLineRankSet = { lineRank: number; runBlockRank: number; passBlockRank: number };

function offensiveLineScore(stats: Player['stats']): { overall: number; run: number; pass: number } {
  const sacksAllowed = Math.max(8, stats.sacksAllowed ?? 36);
  const passingYards = stats.qbPassingYards ?? 3600;
  const rushingYards = stats.teamRushingYards ?? 1700;
  const pass = (passingYards / sacksAllowed) * 7.5 - sacksAllowed * 2.6;
  const run = rushingYards * 0.42;
  return {
    overall: pass * 0.58 + run * 0.42,
    run,
    pass,
  };
}

function rankDescending<T>(items: T[], score: (item: T) => number): Map<T, number> {
  const ranked = [...items].sort((a, b) => score(b) - score(a));
  return new Map(ranked.map((item, index) => [item, index + 1]));
}

const GENERATED_OL_RANKS: Record<string, OLineRankSet> = (() => {
  const records: Array<{ key: string; season: number; stats: Player['stats']; scores: { overall: number; run: number; pass: number } }> = [];
  for (const [teamId, byEra] of Object.entries(NFLVERSE_GENERATED_UNITS)) {
    for (const [startYear, unit] of Object.entries(byEra)) {
      const stats = unit.offensiveLine.stats;
      records.push({
        key: `${teamId}-${startYear}`,
        season: unit.offensiveLine.bestSeasonYear,
        stats,
        scores: offensiveLineScore(stats),
      });
    }
  }

  const bySeason = new Map<number, typeof records>();
  for (const record of records) {
    bySeason.set(record.season, [...(bySeason.get(record.season) ?? []), record]);
  }

  const ranks: Record<string, OLineRankSet> = {};
  for (const seasonRecords of bySeason.values()) {
    const overall = rankDescending(seasonRecords, record => record.scores.overall);
    const run = rankDescending(seasonRecords, record => record.scores.run);
    const pass = rankDescending(seasonRecords, record => record.scores.pass);
    for (const record of seasonRecords) {
      ranks[record.key] = {
        lineRank: overall.get(record) ?? 16,
        runBlockRank: run.get(record) ?? 16,
        passBlockRank: pass.get(record) ?? 16,
      };
    }
  }

  return ranks;
})();

function seededRange(seed: number, offset: number, span: number): number {
  const raw = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return Math.floor((raw - Math.floor(raw)) * span);
}

function overlapDistance(player: DepthPlayer, era: Era): number {
  if (player.from <= era.endYear && player.to >= era.startYear) return 0;
  if (player.to < era.startYear) return era.startYear - player.to;
  return player.from - era.endYear;
}

function playerIdentity(player: DepthPlayer | Player): string {
  return player.name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function selectByPosition(
  players: DepthPlayer[],
  era: Era,
  position: SkillPosition,
  count: number,
  excludedNames = new Set<string>(),
): DepthPlayer[] {
  const seen = new Set(excludedNames);
  const selected: DepthPlayer[] = [];
  const candidates = players
    .filter(player => player.position === position && overlapDistance(player, era) === 0 && !excludedNames.has(playerIdentity(player)))
    .sort((a, b) =>
      (b.isLegend ? 1 : 0) - (a.isLegend ? 1 : 0) ||
      (b.isAllStar ? 1 : 0) - (a.isAllStar ? 1 : 0) ||
      (b.bestSeasonYear ?? b.to) - (a.bestSeasonYear ?? a.to) ||
      b.to - a.to
    );

  for (const candidate of candidates) {
    const identity = playerIdentity(candidate);
    if (seen.has(identity)) continue;
    selected.push(candidate);
    seen.add(identity);
    if (selected.length === count) break;
  }

  return selected;
}

function buildSkillPlayer(team: HistoricalTeam, era: Era, source: DepthPlayer, index: number): Player {
  const overlapsEra = overlapDistance(source, era) === 0;
  const player: Player = {
    id: `nfl-depth-${team.id}-${era.id}-${source.position.toLowerCase()}-${index}-${source.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: source.name,
    position: source.position,
    positionGroup: 'offense',
    eraId: era.id,
    teamId: team.id,
    bestSeasonYear: source.bestSeasonYear ?? Math.min(Math.max(source.from, era.startYear), Math.min(source.to, era.endYear)),
    yearsWithTeam: overlapsEra
      ? `${Math.max(source.from, era.startYear)}-${Math.min(source.to, era.endYear)}`
      : `${source.from}-${source.to}`,
    stats: source.stats,
    playerScore: 0,
    isLegend: source.isLegend,
    isAllStar: source.isAllStar,
  };
  player.playerScore = computePlayerScore(player, 'nfl');
  return applyNflAwardFloors(player, era);
}

function unitStats(team: HistoricalTeam, era: Era, kind: 'ol' | 'def', selected: Player[]): Player['stats'] {
  const generated = NFLVERSE_GENERATED_UNITS[team.id]?.[String(era.startYear)];
  if (generated) {
    if (kind === 'ol') {
      return {
        ...generated.offensiveLine.stats,
        ...(GENERATED_OL_RANKS[`${team.id}-${era.startYear}`] ?? {}),
      };
    }
    return generated.defense.stats;
  }

  const seed = parseInt(team.id, 10) * 43 + era.startYear * 7 + (kind === 'ol' ? 1 : 2);
  const eraBoost = Math.max(0, 2024 - era.startYear) / 70;
  if (kind === 'ol') {
    const qbPassingYards = Math.max(0, ...selected.filter(player => player.position === 'QB').map(player => player.stats.passingYards ?? 0));
    const teamRushingYards = selected
      .filter(player => player.position === 'RB')
      .reduce((sum, player) => sum + (player.stats.rushingYards ?? 0), 0);
    return {
      sacksAllowed: 18 + seededRange(seed, 1, 22),
      qbPassingYards,
      teamRushingYards,
      lineRank: 1 + seededRange(seed, 2, 18),
      runBlockRank: 1 + seededRange(seed, 3, 20),
      passBlockRank: 1 + seededRange(seed, 4, 20),
    };
  }
  return {
    pointsAllowed: Math.round(230 + seededRange(seed, 5, 125) + eraBoost * 35),
    yardsAllowed: Math.round(4200 + seededRange(seed, 6, 1350) + eraBoost * 320),
    sacks: 30 + seededRange(seed, 7, 26),
    takeaways: 18 + seededRange(seed, 8, 22),
    defensiveTfl: 54 + seededRange(seed, 9, 34),
    defensiveStarCount: UNIT_OVERRIDES[`${team.id}-${era.startYear}`]?.defensiveStarCount ?? 0,
    defensiveHofCount: UNIT_OVERRIDES[`${team.id}-${era.startYear}`]?.defensiveHofCount ?? 0,
  };
}

function buildUnit(team: HistoricalTeam, era: Era, kind: 'ol' | 'def', selected: Player[]): Player {
  const override = UNIT_OVERRIDES[`${team.id}-${era.startYear}`];
  const generated = NFLVERSE_GENERATED_UNITS[team.id]?.[String(era.startYear)];
  const name = kind === 'ol'
    ? override?.ol ?? generated?.offensiveLine.name ?? `${era.startYear} ${team.city} ${team.name} O-Line`
    : override?.defense ?? generated?.defense.name ?? `${era.startYear} ${team.city} ${team.name} Defense`;
  const generatedSource = kind === 'ol' ? generated?.offensiveLine : generated?.defense;
  const player: Player = {
    id: `nfl-depth-${team.id}-${era.id}-${kind}`,
    name,
    position: kind === 'ol' ? 'OL' : 'DEF',
    positionGroup: kind === 'ol' ? 'offense' : 'defense',
    eraId: era.id,
    teamId: team.id,
    bestSeasonYear: generatedSource?.bestSeasonYear ?? era.startYear + seededRange(parseInt(team.id, 10) + era.startYear, kind === 'ol' ? 9 : 10, Math.max(1, era.endYear - era.startYear + 1)),
    yearsWithTeam: `${era.startYear}-${era.endYear}`,
    stats: unitStats(team, era, kind, selected),
    playerScore: 0,
    isLegend: Boolean(override?.ol && kind === 'ol') || Boolean(override?.defense && kind === 'def') || Boolean(generatedSource?.isLegend),
  };
  player.playerScore = computePlayerScore(player, 'nfl');
  return player;
}

export function buildFranchiseDepthNFLPlayers(team: HistoricalTeam, era: Era): Player[] {
  const depth = [
    ...(NFL_FRANCHISE_DEPTH_PLAYERS[team.id] ?? []),
    ...(NFLVERSE_GENERATED_DEPTH_PLAYERS[team.id] ?? []),
  ];
  const selectedSources: DepthPlayer[] = [];
  const excludedNames = new Set<string>();
  const add = (items: DepthPlayer[]) => {
    for (const item of items) {
      selectedSources.push(item);
      excludedNames.add(playerIdentity(item));
    }
  };

  const qbs = selectByPosition(depth, era, 'QB', 1, excludedNames);
  add(qbs);
  const rbs = selectByPosition(depth, era, 'RB', 1, excludedNames);
  add(rbs);
  const wrs = selectByPosition(depth, era, 'WR', 2, excludedNames);
  add(wrs);
  const tes = selectByPosition(depth, era, 'TE', 1, excludedNames);
  add(tes);
  if (qbs.length < 1 || rbs.length < 1 || wrs.length < 2 || tes.length < 1) return [];

  const flex = depth
    .filter(player => ['RB', 'WR', 'TE'].includes(player.position) && overlapDistance(player, era) === 0 && !excludedNames.has(playerIdentity(player)))
    .sort((a, b) =>
      (b.isLegend ? 1 : 0) - (a.isLegend ? 1 : 0) ||
      (b.isAllStar ? 1 : 0) - (a.isAllStar ? 1 : 0) ||
      (b.bestSeasonYear ?? b.to) - (a.bestSeasonYear ?? a.to) ||
      b.to - a.to
    )[0];
  if (!flex) return [];
  add([flex]);

  const players = selectedSources.map((player, index) => buildSkillPlayer(team, era, player, index));
  players.push(buildUnit(team, era, 'ol', players), buildUnit(team, era, 'def', players));

  return players.sort((a, b) => b.playerScore - a.playerScore || a.name.localeCompare(b.name));
}
