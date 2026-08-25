import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class names, letting later Tailwind classes win over earlier ones.
 *
 * Without twMerge, `cn("p-2", "p-4")` emits both and the winner depends on
 * stylesheet order rather than call order - which makes component props like
 * `className` unreliable for overriding defaults.
 */
export const cn = (...inputs) => twMerge(clsx(inputs));

export default cn;
