// Safely formats inline markdown: escape HTML first, then turn **bold** into <strong>.

export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function inlineMd(s: string): string {
	return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
