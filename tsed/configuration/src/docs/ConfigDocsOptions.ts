/**
 * Options for {@link ConfigDocs.render}.
 */
export interface ConfigDocsOptions {
    /** Page title, usually the service name. Rendered as `# <title> — configuration`. */
    title: string;
    /** Markdown placed under the title, before the generated sections. Replaces the default introduction. */
    intro?: string;
    /**
     * Also collapses the body of every top-level section (its tables and variants) into a
     * closed `<details>` block. The section heading, description and required/default line stay
     * visible, so the links in the Sections table keep working. Default `false`.
     */
    collapseSections?: boolean;
}
