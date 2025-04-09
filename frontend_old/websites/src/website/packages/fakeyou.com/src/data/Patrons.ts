
class Patron {
  username: string;
  donationTotal: number;

  constructor(username: string, donationTotal: number) {
    this.username = username;
    this.donationTotal = donationTotal;
  }
}

const PATRONS : Patron[] = [
  new Patron('Lordmau5', 103.05),
  new Patron('Manan AI', 75),
  new Patron('Alin A.', 75),
  new Patron('Tyler B.', 55),
  new Patron('CamJam33', 43.4),
  new Patron('EYYCHEEV', 42.75),
  new Patron('Ashleyrath', 33.39),
  new Patron('V', 30),
  new Patron('Koen m.', 30),
  new Patron('Ginger B.', 25),
  new Patron('Peter B.', 24),
  new Patron('Morgan B.', 20),
  new Patron('Anthony A.', 15),
  new Patron('Jarrett B.', 15),
  new Patron('Lou M.', 10),
  new Patron('Kazuya M.', 5),
  new Patron('Ajay R.', 1),
];

export { Patron, PATRONS }
