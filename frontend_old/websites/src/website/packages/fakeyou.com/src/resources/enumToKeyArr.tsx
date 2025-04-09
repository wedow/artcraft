const enumToKeyArr = (type: any) => Object.keys(type).filter(val => isNaN(Number(val)));

export default enumToKeyArr;