import * as LucideIcons from 'lucide-react';

/**
 * Dynamically renders a Lucide icon by name
 * @param {string} iconName - Name of the Lucide icon
 * @param {object} props - Additional props to pass to the icon
 */
export function DynamicIcon({ iconName, className = "w-5 h-5", ...props }) {
    const Icon = LucideIcons[iconName] || LucideIcons.Receipt;
    return <Icon className={className} {...props} />;
}
