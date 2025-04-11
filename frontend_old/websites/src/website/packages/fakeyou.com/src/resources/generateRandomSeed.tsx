export default function generateRandomSeed(){ 
  return Math.floor(Math.random() * Math.pow(2, 32)).toString();
};