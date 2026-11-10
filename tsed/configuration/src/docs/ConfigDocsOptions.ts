/**
 * Options for {@link ConfigDocs.render}.
 */
export interface ConfigDocsOptions {
    /** Page title, usually the service name. Rendered as `# <title> — configuration`. */
    title: string;
    /** Markdown placed under the title, before the generated sections. Replaces the default introduction. */
    intro?: string;
}
