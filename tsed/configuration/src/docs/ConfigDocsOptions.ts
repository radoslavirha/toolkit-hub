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
    /**
     * At every depth below a section, an object-like child (a plain object, or the items of an
     * array or map) gets its own closed `<details>` block when its table would hold more than this
     * many rows: its own row plus every nested row not collapsed further down. Smaller children
     * stay inline in the parent table. `Infinity` turns this off. Union variants are collapsed
     * regardless. Default `5`.
     */
    collapseThreshold?: number;
}
