"use client";

import { ChangeEvent, useEffect, useState } from "react";

export default function ImageFileInput() {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
		const selectedFile = event.target.files?.[0];
		if (!selectedFile) {
			setPreviewUrl(null);
			return;
		}

		const objectUrl = URL.createObjectURL(selectedFile);
		setPreviewUrl((previousUrl) => {
			if (previousUrl) {
				URL.revokeObjectURL(previousUrl);
			}
			return objectUrl;
		});
	}

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	return (
		<div className="space-y-2 rounded-3xl border border-dashed border-border bg-surface-elevated p-4 shadow-sm">
			<label htmlFor="image" className="block text-sm font-medium text-foreground">
				Image (optional)
			</label>

			<input
				id="image"
				name="image"
				type="file"
				accept="image/*"
				onChange={handleImageChange}
				className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft"
			/>

			<p className="text-xs text-foreground/60">
				Accepted formats: image files up to 2MB.
			</p>

			{previewUrl ? (
				<div className="overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-sm">
					<img
						src={previewUrl}
						alt="Selected meal preview"
						className="h-48 w-full rounded-2xl object-cover"
					/>
				</div>
			) : null}
		</div>
	);
}
