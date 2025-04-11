import { useEffect, useState } from 'react';

const S4 = () => (((1+Math.random())*0x10000)|0).toString(16).substring(1);

export default function useId() {
	const [id,idSet] = useState<string>();

	useEffect(() => {
		if (!id) idSet(S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	},[id]);

    return id;
};

// based on https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id/6860916#6860916 