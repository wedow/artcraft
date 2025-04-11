const makeClass = (base: string, add?: string) => ({
	className: `${ base }${ add ? " " + add : "" }`
});

export default makeClass;