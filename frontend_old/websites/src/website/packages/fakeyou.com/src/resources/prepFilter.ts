const prepFilter = (value: string, queryKey: string, override?: any) =>
	({ ...value !== "all" ? { [queryKey]: override || value } : {} });

export default prepFilter;