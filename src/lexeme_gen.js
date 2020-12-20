// for generating random lexeme fixtures (useful during testing)

// const RandExp = require('randexp');
// import * as RandExp from "randexp";


const TYPES = {
	email: `[a-z0-9._+-]{1,20}@[a-z0-9]{3,15}\.[a-z]{2,4}`,
	name: `^*[A-Z][a-z]{3,8}$ *[A-Z][a-z]{1,10}$`,
	age: `^(1[89]|[2-9]\d)$`,
	str: `^[a-zA-Z0-9]{16}$`,
	uid: `^[a-fA-F0-9]{24}$`
}


const Generator = {};

Generator.randomUid = () => {
	return new RandExp(TYPES.uid,"i").gen().trim();
}
Generator.randomEmail = () => {
    return new RandExp(TYPES.email,i);
}

// Generator.randomNumericalRange = (rangeSpan) => {
// 	let age = new RandExp(TYPES.age);
// 	let rangeSpan = rangeSpan || 5;
// 	return `${age}-{age+rangeSpan}`
// }

Generator.randomVal = (_type) => { //_type = String[min_length,max_length, regex], Email, Integer[min,max], Decimal[min,max], Object[(key,keyType)], List[min_indexes,max_indexes,fillType => ]

}


export {
	Generator
}