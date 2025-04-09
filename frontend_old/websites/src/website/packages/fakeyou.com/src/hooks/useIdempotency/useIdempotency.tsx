import { useState } from 'react';
import { v4 as uuidv4 } from "uuid";

export default function useIdempotency() {
	const [token, set] = useState(uuidv4());  
  return { reset: () => set(uuidv4()), create: uuidv4, set, token };
};