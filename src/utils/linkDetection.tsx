export function detectAndRenderLinks(
    text: string,
    onLinkClick: (url: string) => void,
    linkColor?: string
) {
    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <span
                    key={index}
                    onClick={(e) => {
                        e.preventDefault();
                        onLinkClick(part);
                    }}
                    style={{
                        color: linkColor || '#1976d2',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    {part}
                </span>
            );
        }
        return <span key={index}>{part}</span>;
    });
}
