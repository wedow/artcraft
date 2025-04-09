import React from "react";

interface Props {
	className?: string;
	description: string;
	stepNumber: number;
	title: string;
}

export default function InputDescription({
	className,
	description,
	stepNumber,
	title,
}: Props) {
	return (
		<div
			{...{
				className: `fy-input-description${className ? " " + className : ""}`,
			}}
		>
			<div className="d-flex gap-2 align-items-center mb-1">
				{stepNumber && <div className="lp-step">{stepNumber}</div>}
				<h2 className="fs-5 mb-0 fw-semibold">{title}</h2>
			</div>

			<p className="fw-medium fs-7 opacity-75">{description}</p>
		</div>
	);
}
